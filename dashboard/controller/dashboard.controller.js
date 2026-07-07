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
        console.log("📥 Controller recibió los datos para validar:", asignacionData);

        // CORREGIDO: Validamos 'numero_territorio' que es lo que viene de events.js y espera el backend
        if (!asignacionData.numero_territorio || !asignacionData.conductor || !asignacionData.fecha_asignado) {
            console.error("❌ Validación fallida en Controller. Faltan propiedades críticas:", {
                numero_territorio: asignacionData.numero_territorio,
                conductor: asignacionData.conductor,
                fecha_asignado: asignacionData.fecha_asignado
            });
            UIManager.mostrarMensaje("Faltan datos esenciales (Territorio, Conductor o Fecha).", "error");
            return;
        }
        
        try {
            console.log("🚀 Disparando petición HTTP vía Api.crearAsignacion()...");
            const result = await Api.crearAsignacion(asignacionData);
            
            console.log("✅ Respuesta exitosa del Servidor:", result);
            UIManager.mostrarMensaje("✅ Guardado con éxito.", "success");
            
            if (onSuccess) {
                onSuccess();
            }
            
            // Refresca las tarjetas y gráficos del Dashboard principal
            this.cargarDashboardCompleto(); 
        } catch (error) {
            console.error("❌ Error atrapado en Controller.crearAsignacion:", error);
            
            // Logueamos la estructura completa del error para inspección directa
            console.dir(error);

            // Manejo robusto de la respuesta detallada de FastAPI (422 u otros)
            let mensajeError = "Error al guardar en el servidor.";
            if (error && error.detail) {
                mensajeError = typeof error.detail === 'string' 
                    ? error.detail 
                    : JSON.stringify(error.detail);
            } else if (error && error.message) {
                mensajeError = error.message;
            }

            UIManager.mostrarMensaje(`❌ ${mensajeError}`, "error");
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
        // Seleccionamos todas las filas de la tabla de agenda
        const filas = document.querySelectorAll(".agenda-row");
        
        const items = Array.from(filas).map(fila => {
            const inputConductor = fila.querySelector(".input-conductor");
            const inputTerritorio = fila.querySelector(".territory-input");
            const cellEncuentro = fila.querySelector(".encounter-cell");

            return {
                territorio_id: parseInt(fila.dataset.territorioId), // ID real de la DB
                conductor: inputConductor.value || "Sin asignar",
                fecha_asignado: fila.dataset.fecha,
                turno: fila.dataset.turno,
                encuentro: cellEncuentro.innerText || "Salón del Reino"
            };
        });

        if (items.length === 0) {
            UIManager.mostrarMensaje("No hay datos para confirmar", "error");
            return;
        }

        try {
            UIManager.showLoading(true);
            // Enviamos el objeto AgendaConfirmar esperado por el Backend
            await Api.confirmarAgenda({ items: items });

            UIManager.mostrarMensaje("¡Agenda confirmada y archivada!", "success");
            
            // Limpieza y refresco
            document.getElementById("containerPropuesta").innerHTML = "";
            this.cargarDashboardCompleto(); 
        } catch (error) {
            console.error("Error al confirmar:", error);
            UIManager.mostrarMensaje(error.detail || "Error al guardar la agenda", "error");
        } finally {
            UIManager.showLoading(false);
        }
    },

    async cargarHistorial() {
        try {
            const propuesta = await Api.getSugerenciaCombinada(); // array de semanas
            UIManager.renderizarHistorialAgenda(propuesta); // pasa las semanas SIN aplanar
        } catch (error) {
            console.error("Error cargando historial:", error);
        }
    }
};