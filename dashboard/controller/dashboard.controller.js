// dashboard/controller/dashboard.controller.js
import { Api }        from "../model/api.service.js";
import { Validators } from "../model/validators.js";
import { UIManager }  from "../ui/ui.js";

export const Controller = {
    
    async consultarTerritorio(numero) { 

        UIManager.limpiarResultados();
        if (!Validators.territorioValido(numero)) {
            UIManager.mostrarErrorResultados("Ingrese un número de territorio válido.");
            return;
        }
        try {
            // OJO: Recordá que Api.getTerritorio debe estar en api.service.js
            const territorio = await Api.getTerritorio(numero);
            UIManager.renderAsignaciones(territorio.numero, territorio.asignaciones);
        } catch (error) {
            console.error("❌ Error en consulta:", error);
            UIManager.mostrarMensaje("Error al obtener datos", "error");
        }
    },

    async crearAsignacion(asignacionData, onSuccess) {
        if (!asignacionData.numero_territorio || !asignacionData.conductor || !asignacionData.fecha_asignado) {
            UIManager.mostrarMensaje("Faltan datos esenciales.", "error");
            return;
        }
        try {
            const result = await Api.crearAsignacion(asignacionData);
            UIManager.mostrarMensaje(result.message || "Guardado con éxito.", "success");
            if (onSuccess) onSuccess();
            this.cargarDashboardCompleto(); // Recargar tras crear
        } catch (error) {
            UIManager.mostrarMensaje(error.detail || "Error al guardar.", "error");
        }
    },

    async obtenerSugerencias(rangoSeleccionado) {
        UIManager.showLoading(true);
        try {
            // 1. Pedimos los datos al API (rango 1, 2 o 3 según la lógica de severidad del back)
            const data = await Api.getSugerencias(rangoSeleccionado);
            const listaSugerida = Array.isArray(data) ? data : (data.sugerencias || []);
        
            // 2. Definimos los límites según lo que el usuario eligió en el select
            // rangoSeleccionado viene como "1-20", "21-40", o "41-60"
            const [min, max] = rangoSeleccionado.split('-').map(Number);
        
            // 3. Filtramos la lista para que solo queden los del bloque visual correcto
            const listaFiltrada = listaSugerida.filter(s => s.numero >= min && s.numero <= max);
        
            console.log(`✅ Sugerencias filtradas para el bloque ${min}-${max}:`, listaFiltrada);
        
            // 4. Renderizamos solo los que corresponden
            UIManager.renderSugerencias(listaFiltrada);
        
        } catch (error) {
            console.error("❌ Error filtrando sugerencias:", error);
            UIManager.mostrarErrorResultados("Error al procesar el rango de territorios.");
        } finally {
            UIManager.showLoading(false);
        }
    },

    async editarAsignacion(id, campos, onSuccess) {
        try {
            const result = await Api.actualizarSalida(id, campos);
            UIManager.mostrarMensaje(result.message || "Actualizado.", "success");
            if (onSuccess) onSuccess();
        } catch (error) {
            UIManager.mostrarMensaje("Error al actualizar.", "error");
        }
    },

    async eliminarAsignacion(id, onSuccess) {
        if (!confirm("¿Eliminar esta asignación?")) return;
        try {
            const result = await Api.eliminarAsignacion(id);
            UIManager.mostrarMensaje(result.message || "Eliminada.", "success");
            if (onSuccess) onSuccess();
            this.cargarDashboardCompleto();
        } catch (error) {
            UIManager.mostrarMensaje("Error al eliminar.", "error");
        }
    },

    // --- FUNCIONES DE AGENDA ---

    async prepararAgendaQuincenal(fechaInicio) {
        UIManager.showLoading(true); 
        try {
            const plan = await Api.generarPlanQuincenal(fechaInicio);
            UIManager.renderVistaPreviaAgenda(plan || []);
        } catch (error) {
            UIManager.mostrarMensaje("Error al generar propuesta.", "error");
        } finally {
            UIManager.showLoading(false);
        }
    },

    async confirmarAgendaDefinitiva(planRecibido, conductorDefault, onSuccess) {
        try {
            const payload = {
                conductor_default: conductorDefault || "Sin Asignar",
                items: planRecibido.map(item => ({
                    territorio_id: item.territorio_id,
                    fecha_asignado: item.fecha, 
                    turno: item.turno
                }))
            };
            const result = await Api.confirmarAgenda(payload);
            UIManager.mostrarMensaje(result.message, "success");
            if (onSuccess) onSuccess();
            this.cargarDashboardCompleto();
        } catch (error) {
            UIManager.mostrarMensaje(error.detail || "Error al impactar agenda.", "error");
        }
    },

    async cargarDashboardCompleto(rango = 3) {
        try {
            UIManager.showLoading(true);
            const data = await Api.getSugerencias(rango); 
            
            // Si la API devolvió el error de auth como objeto (tu caso del 200 OK)
            if (data.detail === "Not authenticated") {
                throw { status: 401, message: "Sesión expirada" };
            }

            UIManager.renderSugerencias(data.sugerencias);
            UIManager.renderPlanillaS13(data.sugerencias); 
        } catch (error) {
            console.error("Error en dashboard:", error);
            if (error.status === 401 || error.message?.includes("authenticated")) {
                localStorage.removeItem("token");
                window.location.href = "../login/index.html";
            }
        } finally {
            UIManager.showLoading(false); // CRÍTICO: Siempre apagar el loader
        }
    }
};