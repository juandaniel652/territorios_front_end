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

            // El backend YA filtró por rango, solo renderizamos directo
            UIManager.renderSugerencias(listaSugerida);
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

    async cargarDashboardCompleto(rango = "1-20") {
        try {
            UIManager.showLoading(true);
            
            // Cargar sugerencias
            const sugerencias = await Api.getSugerencias(rango);
            UIManager.renderSugerencias(sugerencias.sugerencias || sugerencias);
        
            // Cargar stats
            const stats = await Api.getTerritorio(49);
            
            const canvasContainer = document.getElementById('contenedorGraficoDetalle');
            
            if (stats && window.Charts && window.Charts.renderBarChart) {
                // Mostramos el contenedor antes de renderizar
                if (canvasContainer) canvasContainer.style.display = 'block';
            
                const payload = {
                    labels: ['Asignaciones'], 
                    datasets: [{
                        label: `Territorio ${stats.territorio || 49}`,
                        data: [stats.asignaciones ? stats.asignaciones.length : 0],
                        backgroundColor: '#16a34a'
                    }]
                };
            
                window.Charts.renderBarChart('graficoProgreso', payload); 
            }
        
        } catch (error) {
            console.error("❌ Error en dashboard:", error);
        } finally {
            UIManager.showLoading(false);
        }
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