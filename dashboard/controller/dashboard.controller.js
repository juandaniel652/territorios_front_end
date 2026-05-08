// dashboard/controller/dashboard.controller.js
import { Api }        from "../model/api.service.js";
import { Validators } from "../model/validators.js";
import { UIManager }  from "../ui/ui.js";
import { Charts }     from "../ui/charts.js";

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
            const data = await Api.getSugerencias(rangoSeleccionado);
            const listaSugerida = data.sugerencias || data;
        
            // 1. Renderiza las tarjetas de texto
            UIManager.renderSugerencias(listaSugerida);
        
            // 2. ¡CLAVE! Actualiza el gráfico con el mismo rango
            // Esto hace que el Dashboard sea congruente con lo que ves arriba
            this.actualizarSoloGrafico(listaSugerida);
        
        } catch (error) {
            console.error("❌ Error:", error);
        } finally {
            UIManager.showLoading(false);
        }
    },
    
    // Creamos esta pequeña función de apoyo para no repetir código
    actualizarSoloGrafico(territorios) {
        if (window.Charts && window.Charts.renderBarChart) {
            const values = this._calcularDiasAtraso(territorios);
            const labels = territorios.map(t => `T-${t.numero}`);
            window.Charts.renderBarChart('asignacionesChart', labels, values, "#10b981");
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

    async cargarDashboardCompleto(rango = "1-20") {
        try {
            UIManager.showLoading(true);
            const response = await Api.getSugerencias(rango);
            const territorios = response.sugerencias || response;

            UIManager.renderSugerencias(territorios);

            if (window.Charts && window.Charts.renderBarChart) {
                const labels = territorios.map(t => `T-${t.numero}`);
                const values = this._calcularDiasAtraso(territorios);
                window.Charts.renderBarChart('asignacionesChart', labels, values, "#10b981");
            }
        } catch (error) {
            console.error("❌ Error al cargar dashboard:", error);
        } finally {
            UIManager.showLoading(false);
        }
    },

    // 3. AGREGAMOS esta función privada para centralizar el cálculo
    _calcularDiasAtraso(territorios) {
        const hoy = new Date();
        // Forzamos mediodía para evitar problemas de zona horaria (UTC)
        hoy.setHours(12, 0, 0, 0);
        
        return territorios.map(t => {
            if (!t.ultima_fecha_completado) return 0;
            
            // Reemplaza guiones por barras y toma solo la parte de la fecha
            const partes = t.ultima_fecha_completado.split('T')[0].split(' ')[0];
            const fechaComp = new Date(partes.replace(/-/g, '/'));
            fechaComp.setHours(12, 0, 0, 0);
        
            const diffMs = hoy.getTime() - fechaComp.getTime();
            const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            return isNaN(dias) ? 0 : Math.max(0, dias);
        });
    },

    async obtenerDetalleTerritorio(numero) {
        const res = await Api.getTerritorio(numero);
        return {
            asignaciones: res.asignaciones,
            // Asegúrate de que esto sea lo que tu renderBarChart necesita:
            stats: res.estadisticas || res.proporciones || [10, 20, 30] 
        };
    }
};