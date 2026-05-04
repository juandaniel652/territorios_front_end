// dashboard/ui/ui.js
import { DOM }              from "./dom.js";
import { Tables }           from "./tables.js";
import { Modals }           from "./modals.js";
import { Charts }           from "./charts.js";
import { initGlobalEvents } from "./events.js";
import { Api }              from "../model/api.service.js"; // Usamos el nombre consistente
import { DateFormatter, obtenerLunes } from "./utils.js";
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js";

export const UIManager = {
    // --- PROPIEDADES ---
    _tables: Tables,

    // --- RENDERIZADO DE ASIGNACIONES Y AGENDA ---
    renderAsignaciones(territorio, asignaciones) {
        return this._tables.renderAsignaciones(territorio, asignaciones);
    },

    renderVistaPreviaAgenda(plan, conductores = []) {
        if (this._tables && this._tables.renderVistaPreviaAgenda) {
            this._tables.renderVistaPreviaAgenda(plan, conductores);
        }
    },

    // --- DASHBOARD Y GRÁFICOS ---
    renderDashboard(stats) {
        document.getElementById("totalAsignaciones").textContent = stats.total_asignaciones || 0;
        document.getElementById("territoriosActivos").textContent = stats.territorios_activos || 0;

        if (Charts) {
            Charts.renderBarChart(
                document.getElementById("asignacionesChart"), 
                stats.chart_data.labels, 
                stats.chart_data.values
            );
        }

        const seccionS13 = document.getElementById("seccionPlanillaS13");
        if (seccionS13) {
            seccionS13.classList.remove("hidden");
            this.renderPlanillaS13(stats.territorios_detalle || []);
        }
    },

    renderSugerencias(sugerencias) {
        const container = DOM.resultadoSugerencias;
        if (!container || !sugerencias) return;

        container.innerHTML = sugerencias.map(s => `
            <div class="sugerencia-card">
                <span class="sugerencia-card__num">T-${s.numero}</span>
                <div class="sugerencia-card__info">
                    <p class="sugerencia-card__last">Última: ${DateFormatter.format(s.ultima_fecha)}</p>
                    <p class="sugerencia-card__days">Sin asignar: <strong>${s.dias_atraso ?? "—"} días</strong></p>
                </div>
            </div>`).join("");
        
        Charts.renderBarChart(
            DOM.canvasAsignaciones, 
            sugerencias.map(s => `T-${s.numero}`), 
            sugerencias.map(s => s.dias_atraso ?? 0)
        );
    },

    // --- PLANILLA S-13 (HISTORIAL TÉCNICO) ---
    renderPlanillaS13(data) {
        const tbody = document.getElementById("tbodyS13");
        if (!tbody) return;
        tbody.innerHTML = data.map(terr => {
            const historial = terr.historial || [];
            let row = `<tr class="border-b border-black h-[42px]">
                <td class="border-r border-black font-bold bg-gray-50">${String(terr.numero).padStart(2, '0')}</td>
                <td class="border-r border-black text-[10px]">${terr.ultima_fecha_anterior || '—'}</td>`;
            
            for (let i = 0; i < 5; i++) {
                const reg = historial[i];
                if (reg) {
                    row += `<td class="border-r border-black p-1 text-[9px]">
                        <strong>${reg.conductor}</strong><br><span class="text-gray-500">${reg.fecha_asignado}</span>
                    </td><td class="border-r border-black text-[9px]">${reg.fecha_completado || ''}</td>`;
                } else {
                    row += `<td class="border-r border-black"></td><td class="border-r border-black"></td>`;
                }
            }
            return row + `</tr>`;
        }).join("");
    },

    // --- GESTIÓN DE EVENTOS DE INTERFAZ ---
    showLoading(estado) {
        const loader = document.getElementById("mainLoader");
        if (loader) loader.classList.toggle("hidden", !estado);
    },

    mostrarMensaje(texto, tipo = "success") {
        const msg = document.getElementById("mensaje");
        if (!msg) return;
        msg.textContent = texto;
        msg.className = tipo === "success" ? "text-green-600 font-bold" : "text-red-600 font-bold";
        setTimeout(() => { msg.textContent = ""; }, 4000);
    },

    initDatePickers() {
        const config = { locale: Spanish, dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y" };
        document.querySelectorAll(".datepicker").forEach(el => flatpickr(el, config));
    }
};

// --- EXPOSICIÓN GLOBAL Y ARRANQUE ---
window.UIManager = UIManager;

// Inicialización retardada para asegurar que el DOM esté listo en Vercel
setTimeout(() => {
    initGlobalEvents();
    UIManager.initDatePickers();
    console.log("✅ UI Sistema inicializado");
}, 150);