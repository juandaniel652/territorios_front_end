// ui/ui.js
import { DOM }              from "./dom.js";
import { Tables }           from "./tables.js";
import { Modals }           from "./modals.js";
import { Charts }           from "./charts.js";
import { initGlobalEvents } from "./events.js";
import { DateFormatter }    from "./utils.js";
//------------------------------------
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js";
import "flatpickr/dist/flatpickr.min.css";

// --- ESTO ES LO QUE FALTA ---
let onAsignacionModificadaCallback = () => {};

export const setOnAsignacionModificada = (fn) => {
    onAsignacionModificadaCallback = fn;
};
// ----------------------------

// Inicializamos los listeners globales una sola vez al cargar el módulo
initGlobalEvents();

console.log("🚀 UI.js cargado: " + new Date().toLocaleTimeString('es-AR'));
export const UI = {
    renderAsignaciones: (territorio, asignaciones) => Tables.renderAsignaciones(territorio, asignaciones),

    renderVistaPreviaAgenda(plan) {
        // Si Tables tiene el método, usalo así:
        Tables.renderVistaPreviaAgenda(plan);
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
        if (!container) return; // Protección extra por si el elemento no existe en el DOM actual

        if (!sugerencias?.length) {
            container.innerHTML = `<p class="result-empty">No hay sugerencias disponibles.</p>`;
            return;
        }
        container.innerHTML = sugerencias.map(s => {
            // 2. Formatear la fecha de la sugerencia
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

    mostrarCarga: (estado) => {
        // Esto busca el botón y le cambia el texto o lo deshabilita
        const btn = document.getElementById("btnGenerarPropuesta");
        if (!btn) return;
        
        if (estado) {
            btn.disabled = true;
            btn.innerHTML = "Generando..."; // O un spinner
            btn.style.opacity = "0.7";
        } else {
            btn.disabled = false;
            btn.innerHTML = "Generar Propuesta";
            btn.style.opacity = "1";
        }
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
        DOM.resultadoDiv.innerHTML = `
            <div class="result-error">
                <span>⚠</span><p>${msg}</p>
            </div>`;
    },

    cerrarModalEdicion() {
        Modals.cerrarEdicion();
        if (onAsignacionModificadaCallback) onAsignacionModificadaCallback();
    },

    cerrarModalConfirm() {
        Modals.cerrarConfirmar();
        if (onAsignacionModificadaCallback) onAsignacionModificadaCallback();
    },

    // dashboard/ui/ui.js
    initDatePickers() {
        const config = {
            locale: Spanish,
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d/m/Y",
            allowInput: true
        };
    
        // Usamos una clase o chequeamos si ya existe la instancia
        document.querySelectorAll("#editFechaAsignado, #editFechaCompletado").forEach(el => {
            if (el && !el._flatpickr) { // <--- ESTA ES LA CLAVE
                flatpickr(el, config);
            }
        });
    }
};