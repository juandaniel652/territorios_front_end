// dashboard/controller/dashboard.controller.js
import { Api }        from "../model/api.service.js";
import { Validators } from "../model/validators.js";
import { UIManager }  from "../ui/ui.js";
import { Charts }     from "../ui/charts.js";
import { CONFIG } from "../config.js";

const API_BASE = CONFIG.BASE_URL;

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
            const labels = territorios.map(t => `T-${t.numero}`);
            const values = this._calcularDiasAtraso(territorios);
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


    async cargarDashboardCompleto(rango = "1-20") {
        try {
            UIManager.showLoading(true);

            // 1. Pedir datos
            const response = await Api.getSugerencias(rango);
            const territorios = response.sugerencias || response;

            // 2. Renderizar tarjetas
            UIManager.renderSugerencias(territorios);

            // 3. Renderizar Gráfico
            if (window.Charts && window.Charts.renderBarChart) {
                const labels = territorios.map(t => `T-${t.numero}`);
                const values = this._calcularDiasAtraso(territorios);

                console.log("📊 Datos cargados para gráfico:", { labels, values });

                // Usamos el ID exacto de tu canvas
                window.Charts.renderBarChart('asignacionesChart', labels, values, "#10b981");
            }
        } catch (error) {
            console.error("❌ Error al cargar dashboard:", error);
        } finally {
            UIManager.showLoading(false);
        }
    },

    _calcularDiasAtraso(territorios) {
        return territorios.map(t => {
            // Usamos directamente el valor que manda el backend
            // Si no existe, devolvemos 0
            const valor = t.dias_atraso !== undefined ? t.dias_atraso : 0;

            // Un pequeño truco: si es 0, devolvemos 0.5 para que se vea
            // una línea verde mínima en el gráfico y no quede vacío.
            return valor === 0 ? 0.5 : valor;
        });
    },
    
    async obtenerDetalleTerritorio(numero) {
        const res = await Api.getTerritorio(numero);
        return {
            asignaciones: res.asignaciones,
            // Asegúrate de que esto sea lo que tu renderBarChart necesita:
            stats: res.estadisticas || res.proporciones || [10, 20, 30] 
        };
    },

    async generarPropuesta(fechaInicio) {
        UIManager.showLoading(true);
        try {
            // Llama al endpoint que probamos antes en el navegador
            const plan = await Api.generarPlanQuincenal(fechaInicio);
            UIManager.renderizarPropuestaAgenda(plan);
        } catch (error) {
            console.error("Error al generar plan:", error);
            UIManager.mostrarMensaje("No se pudo generar la propuesta", "error");
        } finally {
            UIManager.showLoading(false);
        }
    },

    async confirmarAgenda() {
        // Buscamos los inputs de texto que el usuario completó en la tabla de agenda
        const inputs = document.querySelectorAll(".input-conductor");
        
        const asignaciones = Array.from(inputs).map(input => ({
            territorio_id: parseInt(input.dataset.territorio),
            fecha: input.dataset.fecha,
            turno: input.dataset.turno,
            conductor: input.value || "Sin asignar"
        }));

        if (asignaciones.length === 0) return;

        try {
            UIManager.showLoading(true);
            // Enviamos el array al POST que creamos en el backend
            await Api.confirmarAgenda({ asignaciones });

            UIManager.mostrarMensaje("¡Agenda confirmada con éxito!", "success");

            // Limpiamos la tabla de propuesta para que no se mande dos veces
            document.getElementById("containerPropuesta").innerHTML = "";
            document.getElementById("accionesPropuesta").classList.add("hidden");

            // Actualizamos el historial de abajo
            await this.cargarHistorial();
        } catch (error) {
            console.error("Error al confirmar:", error);
            UIManager.mostrarMensaje("Error al guardar la agenda", "error");
        } finally {
            UIManager.showLoading(false);
        }
    },

    async cargarHistorial() {
        try {
            // Llama a las últimas "salidas" o "asignaciones" confirmadas
            const historial = await Api.getHistorialAgenda(); 
            UIManager.renderizarHistorialAgenda(historial);
        } catch (error) {
            console.error("Error cargando historial:", error);
        }
    }
};