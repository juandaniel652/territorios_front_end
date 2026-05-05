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
    renderSugerencias(sugerencias) {
        const contenedor = document.getElementById("resultadoSugerencias");
        if (!contenedor) return;

        contenedor.innerHTML = ""; // Limpiamos

        if (sugerencias.length === 0) {
            contenedor.innerHTML = `<p class="result-empty p-4">No hay territorios sugeridos en este rango.</p>`;
            return;
        }

        // Definimos los colores corporativos según la severidad
        const estilosSeveridad = {
            'critico': { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', label: 'CRÍTICO' },
            'severo':  { bg: '#fffbeb', border: '#fef3c7', text: '#d97706', label: 'SEVERO' },
            'normal':  { bg: '#f0fdf4', border: '#dcfce7', text: '#16a34a', label: 'NORMAL' }
        };

        sugerencias.forEach(s => {
            const estilo = estilosSeveridad[s.severidad] || estilosSeveridad['normal'];
            
            const card = document.createElement("div");
            card.className = "sugerencia-card animate-in";
            // Aplicamos un borde sutil del color de la severidad
            card.style.borderLeft = `4px solid ${estilo.text}`;

            card.innerHTML = `
                <div class="sugerencia-card__num">${s.numero}</div>
                <div class="sugerencia-card__info">
                    <p class="sugerencia-card__last">Última vez: <strong>${s.ultima_visita}</strong></p>
                    <p class="sugerencia-card__days">Hace <strong>${s.dias_atraso}</strong> días</p>
                    <p class="sugerencia-card__sev" style="color: ${estilo.text}; font-weight: 600;">
                        ● ${estilo.label}
                    </p>
                </div>
                <button class="btn-primary-sm" onclick="window.UI.seleccionarTerritorio(${s.numero})" 
                        style="padding: 6px 10px; font-size: 11px; background: ${s.severidad === 'critico' ? '#171b24' : ''}">
                    Asignar
                </button>
            `;
            contenedor.appendChild(card);
        });
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
    showLoading: function(estado) {
        const loader = document.getElementById("mainLoader");
        if (!loader) return;
        loader.classList.toggle("hidden", !estado);
        loader.style.display = estado ? "flex" : "none";
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

    limpiarResultados: function() {
        const container = document.getElementById("containerResultados");
        if (container) container.innerHTML = "";
    },

    cambiarSeccion: function(btnId) {
        console.log("🔄 Cambiando sección para el botón:", btnId);
        const sectionId = btnId.replace('btn', 'seccion');
        const targetSection = document.getElementById(sectionId);
        
        if (targetSection) {
            // Ocultar todas las secciones
            document.querySelectorAll('section[id^="seccion"], .section-base').forEach(s => {
                s.classList.add('hidden');
            });

            // Mostrar la elegida
            targetSection.classList.remove('hidden');
            targetSection.classList.add('animate-in');
            
            // Actualizar Header y Botones
            const btn = document.getElementById(btnId);
            if (btn) {
                const titulo = btn.innerText.trim();
                document.getElementById("headerTitle").textContent = titulo;
                
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        } else {
            console.warn(`⚠️ No se encontró la sección: ${sectionId}`);
        }
        this.showLoading(false);
    },

    mostrarErrorResultados: function(mensaje) {
        const container = document.getElementById("containerResultados");
        if (container) {
            container.innerHTML = `
                <div class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                    <p class="font-medium">${mensaje}</p>
                </div>
            `;
        }
    },
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