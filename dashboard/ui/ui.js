// ui/ui.js
import { DOM }              from "./dom.js";
import { Tables }           from "./tables.js";
import { Modals }           from "./modals.js";
import { Charts }           from "./charts.js";
import { initGlobalEvents } from "./events.js";
import { DateFormatter, obtenerLunes } from "./utils.js";
import { prepararAgendaQuincenal } from "../application/usecases/controller.js";
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js";
import "flatpickr/dist/flatpickr.min.css";

let onAsignacionModificadaCallback = () => {};

export const setOnAsignacionModificada = (fn) => {
    onAsignacionModificadaCallback = fn;
};

console.log("🚀 UI.js cargado: " + new Date().toLocaleTimeString('es-AR'));

export const UI = {
    // 1. Definimos la propiedad interna pero no la asignamos todavía
    _tables: null, 

    renderAsignaciones: (territorio, asignaciones) => {
        // Usamos la referencia inyectada
        return (UI._tables || Tables).renderAsignaciones(territorio, asignaciones);
    },

    renderVistaPreviaAgenda(plan, conductores = []) {
        const t = UI._tables || Tables || window.Tables;
        if (t && t.renderVistaPreviaAgenda) {
            t.renderVistaPreviaAgenda(plan, conductores);
        } else {
            console.error("❌ Error: No se pudo encontrar el módulo Tables");
        }
    },

    renderDashboard(stats) {
        document.getElementById("totalAsignaciones").textContent = stats.total_asignaciones;
        document.getElementById("territoriosActivos").textContent = stats.territorios_activos;
        document.getElementById("asignacionesCompletadas").textContent = stats.asignaciones_completadas;

        Charts.renderBarChart(
            DOM.canvasAsignaciones, 
            stats.chart_data.labels, 
            stats.chart_data.values
        );
    },

    renderSugerencias(sugerencias) {
        const container = DOM.resultadoSugerencias;
        if (!container) return;

        if (!sugerencias?.length) {
            container.innerHTML = `<p class="result-empty">No hay sugerencias disponibles.</p>`;
            return;
        }
        container.innerHTML = sugerencias.map(s => {
            const fechaSugerenciaAR = DateFormatter.toArgentina(s.ultima_fecha);
            return `
            <div class="sugerencia-card">
                <span class="sugerencia-card__num">T-${s.numero}</span>
                <div class="sugerencia-card__info">
                    <p class="sugerencia-card__last">Última: ${fechaSugerenciaAR}</p>
                    <p class="sugerencia-card__days">Sin asignar: <strong>${s.dias_atraso ?? "—"} días</strong></p>
                    <p class="sugerencia-card__sev">Severidad: ${s.severidad}</p>
                </div>
            </div>`;
        }).join("");
        
        Charts.renderBarChart(
            DOM.canvasAsignaciones, 
            sugerencias.map(s => `T-${s.numero}`), 
            sugerencias.map(s => s.dias_atraso ?? 0),
            "rgba(34, 197, 94, 0.5)"
        );
    },

    mostrarCarga(estado) {
        const btn = document.getElementById("btnGenerarPropuesta");
        if (!btn) return;
        btn.disabled = !!estado;
        btn.innerHTML = estado ? "Generando..." : "Generar Propuesta";
        btn.style.opacity = estado ? "0.7" : "1";
    },

    mostrarMensaje(texto, tipo = "success") {
        DOM.mensaje.textContent = texto;
        DOM.mensaje.className = tipo === "success" ? "msg-success" : "msg-error";
        setTimeout(() => {
            DOM.mensaje.textContent = "";
            DOM.mensaje.className = "";
        }, 4000);
    },

    limpiarResultados() {
        DOM.resultadoDiv.innerHTML = "";
    },

    mostrarErrorResultados(msg) {
        DOM.resultadoDiv.innerHTML = `<div class="result-error"><span>⚠</span><p>${msg}</p></div>`;
    },

    cerrarModalEdicion() {
        Modals.cerrarEdicion();
        if (onAsignacionModificadaCallback) onAsignacionModificadaCallback();
    },

    cerrarModalConfirm() {
        Modals.cerrarConfirmar();
        if (onAsignacionModificadaCallback) onAsignacionModificadaCallback();
    },

    initDatePickers() {
        const config = {
            locale: Spanish,
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d/m/Y",
            allowInput: true
        };
        // AGREGAMOS #fechaInicioAgenda a la lista de selectores
        document.querySelectorAll("#editFechaAsignado, #editFechaCompletado, #fechaInicioAgenda").forEach(el => {
            if (el && !el._flatpickr) flatpickr(el, config);
        });
    },

    // --- NUEVO MÉTODO PARA EL PUNTO 1 ---
    async manejarGenerarAgenda() {
        const input = document.getElementById("fechaInicioAgenda");
        if (!input || !input.value) {
            this.mostrarMensaje("Selecciona una fecha", "error");
            return;
        }

        // 1. Primero calculamos la fecha
        const fechaLunes = obtenerLunes(input.value);
        console.log(`🚀 Mandando al controlador: ${fechaLunes}`);

        // 2. Mostramos el estado de carga
        this.mostrarCarga(true);

        try {
            // 3. Llamamos al proceso (prepararAgendaQuincenal se encarga de llamar a la API
            // y de invocar a UI.renderVistaPreviaAgenda internamente)
            await prepararAgendaQuincenal(fechaLunes, this);

            // 4. Si por alguna razón prepararAgendaQuincenal NO llama al render, 
            // lo podés forzar acá, pero normalmente el controlador ya lo hace.

        } catch (error) {
            console.error("Error al generar agenda:", error);
            this.mostrarMensaje("Error al procesar la agenda", "error");
        } finally {
            this.mostrarCarga(false);
        }
    },

    async manejarConfirmarAgenda() {
        const filas = document.querySelectorAll("#containerPropuesta tbody tr");
        const items = [];
        let errorValidacion = false;

        filas.forEach(fila => {
            // 1. Extraemos el número del "Input Inteligente"
            const inputNum = fila.querySelector(".territory-input");
            const nuevoNumero = inputNum ? parseInt(inputNum.value) : null;
            
            // 2. Extraemos los metadatos de la fila (Fecha y Turno no cambian)
            const fecha_asignado = fila.dataset.fecha;
            const turno = fila.dataset.turno;

            // 3. Extraemos Conductor y Encuentro
            const inputConductor = fila.querySelector("input[list='listaConductores']");
            const conductor = inputConductor ? inputConductor.value.trim() : "";
            const encuentro = fila.querySelector(".encounter-cell").innerText.trim() || "Sin especificar";

            // Validación: Si hay número pero no hay conductor
            if (nuevoNumero && !conductor) {
                inputConductor.style.border = "1px solid red";
                errorValidacion = true;
            } else if (nuevoNumero && conductor) {
                inputConductor.style.border = "none";
                items.push({
                    numero_territorio: nuevoNumero, // Mandamos el número editado
                    fecha_asignado,
                    turno,
                    conductor,
                    encuentro
                });
            }
        });

        if (errorValidacion) {
            this.mostrarMensaje("Faltan conductores en algunas salidas", "error");
            return;
        }

        if (items.length === 0) {
            this.mostrarMensaje("No hay datos para guardar", "error");
            return;
        }

        try {
            console.log("🚀 Enviando Agenda con intercambios:", items);
            
            // Aquí llamarás a tu API.confirmarAgenda(items)
            // this.mostrarCarga(true);
            // await API.confirmarAgenda(items);
            
            this.mostrarMensaje("¡Agenda guardada y archivada con éxito!");
            // Opcional: limpiar la tabla después de guardar
            // document.getElementById("containerPropuesta").innerHTML = "";
            
        } catch (error) {
            console.error("Error al guardar:", error);
            this.mostrarMensaje("Error al conectar con el servidor", "error");
        }
    }

    
};

// --- EL TRUCO PARA VERCEL ---
// 1. Asignación manual
UI._tables = Tables;
// 2. Exposición global por si Vite "esconde" los módulos
window.UI = UI; 
window.Tables = Tables; 

// 3. Inicialización retardada: SOLAMENTE UNA VEZ
setTimeout(() => {
    initGlobalEvents();
    console.log("✅ Sistema inicializado y dependencias inyectadas");
}, 100);