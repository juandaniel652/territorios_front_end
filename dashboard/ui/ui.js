// dashboard/ui/ui.js
import { DOM }              from "./dom.js";
import { Tables }           from "./tables.js";
import { Modals }           from "./modals.js";
import { Charts }           from "./charts.js";
import { initGlobalEvents } from "./events.js";
import { DateFormatter }    from "./utils.js";
import { Controller } from "../controller/dashboard.controller.js";
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js";

/**
 * UIManager - Orquestador único de la Interfaz
 * Se encarga de la manipulación del DOM y delegar a componentes especializados (Tables, Charts)
 */
export const UIManager = {
    // --- RENDERIZADO DE ASIGNACIONES Y AGENDA ---
    renderAsignaciones(territorio, asignaciones) {
        return Tables.renderAsignaciones(territorio, asignaciones);
    },

    renderVistaPreviaAgenda(plan, conductores = []) {
        if (Tables && Tables.renderVistaPreviaAgenda) {
            Tables.renderVistaPreviaAgenda(plan, conductores);
        }
    },

    // --- DASHBOARD Y GRÁFICOS ---
    renderDashboard(stats) {
        // Actualización de contadores con fallback a 0
        const elTotal = document.getElementById("totalAsignaciones");
        const elActivos = document.getElementById("territoriosActivos");
        
        if (elTotal) elTotal.textContent = stats.total_asignaciones || 0;
        if (elActivos) elActivos.textContent = stats.territorios_activos || 0;

        if (Charts && stats.chart_data) {
            Charts.renderBarChart(
                document.getElementById("asignacionesChart"), 
                stats.chart_data.labels || [], 
                stats.chart_data.values || []
            );
        }

        // Mostrar S-13 automáticamente si hay datos
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
        
        if (Charts && DOM.canvasAsignaciones) {
            Charts.renderBarChart(
                DOM.canvasAsignaciones, 
                sugerencias.map(s => `T-${s.numero}`), 
                sugerencias.map(s => s.dias_atraso ?? 0)
            );
        }
    },

    // --- PLANILLA S-13 (HISTORIAL TÉCNICO) ---
    renderPlanillaS13(data) {
        const tbody = document.getElementById("tbodyS13");
        if (!tbody) return;

        const registros = Array.isArray(data) ? data : [];

        if (registros.length === 0) {
            tbody.innerHTML = `<tr><td colspan="12" class="p-4 text-center text-gray-400 italic">No hay datos para la planilla S-13</td></tr>`;
            return;
        }

        tbody.innerHTML = registros.map(terr => {
            const historial = terr.historial || [];
            let row = `<tr class="border-b border-black h-[42px]">
                <td class="border-r border-black font-bold bg-gray-50 text-center">${String(terr.numero).padStart(2, '0')}</td>
                <td class="border-r border-black text-[10px] text-center">${terr.ultima_fecha_anterior || '—'}</td>`;
            
            // Renderizamos 5 columnas de historial (estándar S-13)
            for (let i = 0; i < 5; i++) {
                const reg = historial[i];
                if (reg) {
                    row += `<td class="border-r border-black p-1 text-[9px]">
                        <strong>${reg.conductor}</strong><br><span class="text-gray-400">${reg.fecha_asignado}</span>
                    </td><td class="border-r border-black text-[9px] text-center">${reg.fecha_completado || ''}</td>`;
                } else {
                    row += `<td class="border-r border-black"></td><td class="border-r border-black"></td>`;
                }
            }
            return row + `</tr>`;
        }).join("");
    },

    // --- NAVEGACIÓN Y ESTADOS ---
    showLoading(estado) {
    // Buscamos cualquier cosa que parezca un loader si el ID no existe
        const loader = document.getElementById("mainLoader") || document.querySelector(".loading, .spinner");
        if (loader) {
            loader.classList.toggle("hidden", !estado);
        }
        // Si no hay loader, simplemente no hacemos nada, pero ya no se tilda.
    },
    
    mostrarMensaje(texto, tipo = "success") {
        const msg = document.getElementById("mensaje");
        if (!msg) return;
        msg.textContent = texto;
        msg.className = tipo === "success" ? "text-green-600 font-bold p-2" : "text-red-600 font-bold p-2";
        setTimeout(() => { msg.textContent = ""; msg.className = ""; }, 4000);
    },

    initDatePickers() {
        const config = { locale: Spanish, dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y" };
        document.querySelectorAll(".datepicker").forEach(el => flatpickr(el, config));
    },

    // Requisito para events.js: Navegación a la agenda
    verAgendaGuardada() {
        console.log("📅 Navegando a Agenda Quincenal...");
        // 1. Ocultar todas las secciones base
        document.querySelectorAll('.section-base, section').forEach(s => s.classList.add('hidden'));
        
        // 2. Mostrar la sección de agenda
        const seccion = document.getElementById('seccionAgenda');
        if (seccion) {
            seccion.classList.remove('hidden');
            seccion.classList.add('animate-in');
        } else {
            console.error("No se encontró la sección #seccionAgenda");
        }
    },

    limpiarResultados() {
        if (DOM.resultadoTerritorio) DOM.resultadoTerritorio.innerHTML = "";
    }
};

// --- EXPOSICIÓN GLOBAL PARA DELEGACIÓN DE EVENTOS ---
// Inicialización controlada
window.UI = {
    // Esta función maneja el cambio de pestaña Y la carga de datos
    verAgendaGuardada: async () => {
        console.log("📅 Accediendo a la sección Agenda...");
        
        // 1. Lógica Visual (Mostrar/Ocultar)
        document.querySelectorAll('.section-base, section').forEach(s => s.classList.add('hidden'));
        const seccion = document.getElementById('seccionAgenda');
        if (seccion) {
            seccion.classList.remove('hidden');
        }

        // 2. Lógica de Datos (Llamar al backend)
        try {
            // Llamamos al controller para que traiga los datos frescos
            await Controller.cargarDashboardCompleto(3); 
        } catch (err) {
            console.error("❌ Error al refrescar datos desde la agenda:", err);
        }
    },

    manejarGenerarAgenda: async () => {
        const fecha = document.getElementById("inputFechaInicio")?.value;
        if (!fecha) {
            alert("Por favor, selecciona una fecha de inicio.");
            return;
        }
        console.log("🛠️ Generando propuesta para:", fecha);
        await Controller.prepararAgendaQuincenal(fecha);
    },

    manejarConfirmarAgenda: async () => {
        console.log("💾 Confirmando agenda definitiva...");
        // Recolectamos los datos de la tabla que Tables.js renderizó
        // Si no tienes una variable global, el controller debería buscar en el DOM
        await Controller.confirmarAgendaDefinitiva(window.datosPropuestaActual || []);
    }
};

console.log("✅ window.UI vinculado con éxito al Controller");