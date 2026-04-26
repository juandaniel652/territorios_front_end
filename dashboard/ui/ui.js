// ui/ui.js
import { DOM }              from "./dom.js";
import { Tables }           from "./tables.js";
import { Modals }           from "./modals.js";
import { Charts }           from "./charts.js";
import { initGlobalEvents } from "./events.js";
import { Api } from "../infrastructure/api/api.js";
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

        filas.forEach(fila => {
            const inputNum = fila.querySelector(".territory-input");
            const nuevoNumero = inputNum ? parseInt(inputNum.value) : null;
            const fecha_asignado = fila.dataset.fecha;
            const turno = fila.dataset.turno;
            const inputConductor = fila.querySelector("input[list='listaConductores']");
            const conductor = inputConductor ? inputConductor.value.trim() : "";
            const encuentro = fila.querySelector(".encounter-cell")?.innerText.trim() || "";

            if (nuevoNumero && conductor) {
                items.push({
                    territorio_id: nuevoNumero,
                    fecha_asignado: fecha_asignado,
                    turno: turno,
                    conductor: conductor,
                    encuentro: encuentro
                });
            }
        });

        if (items.length === 0) return;

        try {
            this.mostrarCarga(true);
            
            // Enviamos al endpoint que ahora solo guarda Salidas
            const result = await Api.confirmarAgenda({ 
                items: items,
                conductor_default: "Varios" 
            });
            
            // Mostramos el éxito con el conteo real del backend
            this.mostrarMensaje(`✅ Agenda guardada: ${result.total_programado} salidas programadas.`, "success");

            // Limpiamos la propuesta ya procesada
            document.getElementById("containerPropuesta").innerHTML = "";
            
        } catch (error) {
            console.error("Error:", error);
            this.mostrarMensaje("Error al guardar la agenda", "error");
        } finally {
            this.mostrarCarga(false);
        }
    },

    async verAgendaGuardada() {
        try {
            const agenda = await Api.obtenerSalidasQuincena(); // Debes crear este método en tu api.js
            this.renderizarTablaHistorial(agenda);
        } catch (error) {
            this.mostrarMensaje("No se pudo cargar la agenda", "error");
        }
    },

    renderizarTablaHistorial(agenda) {
            const contenedor = document.getElementById("containerHistorial");
            let html = `
                <table class="table w-full bg-base-100 shadow-xl">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Turno</th>
                            <th>Territorio</th>
                            <th>Conductor</th>
                            <th>Encuentro</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            agenda.forEach(item => {
                html += `
                    <tr>
                        <td>${item.fecha}</td>
                        <td>${item.turno}</td>
                        <td>${item.territorio_id}</td>
                        <td>${item.conductor?.nombre || 'Sin asignar'}</td>
                        <td>${item.punto_encuentro || '-'}</td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
            contenedor.innerHTML = html;
        },

    async cargarYMostrarAgenda() {
        try {
            const agenda = await Api.obtenerAgendaGuardada();
            const contenedor = document.getElementById("containerAgendaGuardada");

            window.agendaActual = agenda; 

            if (!agenda || agenda.length === 0) {
                contenedor.innerHTML = `
                    <div class="py-12 text-center border-2 border-dashed border-gray-100 rounded-xl">
                        <p class="text-gray-400 font-medium">No hay salidas programadas en el historial.</p>
                    </div>`;
                return;
            }

            let html = `
                <table class="data-table w-full">
                    <thead>
                        <tr>
                            <th class="p-4 text-center">Territorio</th>
                            <th class="p-4">Conductor / Responsable</th>
                            <th class="p-4">Punto de Encuentro</th>
                            <th class="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
            `;

            agenda.forEach(item => {
                const esSinAsignar = !item.conductor || item.conductor === 'Sin asignar';
                const fechaLegible = item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '---';

                html += `
                    <tr class="hover:bg-gray-50/80 transition-colors group">
                        <!-- COLUMNA 1: TERRITORIO -->
                        <td class="p-4 text-center">
                            <div class="flex flex-col items-center">
                                <span class="territorio-badge text-lg">#${String(item.territorio_id).padStart(2, '0')}</span>
                                <span class="text-[10px] text-gray-400 font-bold uppercase mt-1">${fechaLegible}</span>
                            </div>
                        </td>

                        <!-- COLUMNA 2: CONDUCTOR -->
                        <td class="p-4">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-full ${esSinAsignar ? 'bg-red-50' : 'bg-green-50'} flex items-center justify-center border border-gray-100">
                                    <svg class="w-4 h-4 ${esSinAsignar ? 'text-red-400' : 'text-green-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                </div>
                                <div class="flex flex-col">
                                    <span class="${esSinAsignar ? 'text-red-500 italic' : 'text-gray-900 font-semibold'} leading-tight">
                                        ${item.conductor || 'Sin asignar'}
                                    </span>
                                    <span class="text-[11px] text-gray-500 font-medium">Responsable de salida</span>
                                </div>
                            </div>
                        </td>

                        <!-- COLUMNA 3: PUNTO DE ENCUENTRO -->
                        <td class="p-4">
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-700 font-medium">${item.punto_encuentro || 'A coordinar'}</span>
                                <div class="flex items-center gap-1 mt-0.5">
                                    <span class="badge-turno">${item.turno}</span>
                                </div>
                            </div>
                        </td>

                        <!-- COLUMNA 4: ACCIONES -->
                        <td class="p-4 text-right">
                            <div class="flex justify-end gap-2">
                                <button onclick="gestionarEdicion(${item.id})" 
                                        class="btn-gestion-outline hover:border-green-500 hover:text-green-600 flex items-center gap-1">
                                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    Editar
                                </button>
                                <button onclick="confirmarBaja(${item.id})" 
                                        class="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
            contenedor.innerHTML = html;

        } catch (error) {
            console.error("Error al cargar agenda:", error);
            contenedor.innerHTML = `<div class="p-4 text-red-500 bg-red-50 rounded-lg text-sm">Error al cargar datos del servidor.</div>`;
        }
    },


    activarEdicion(id) {
        const fila = document.querySelector(`tr[data-id="${id}"]`);
        const celdaCond = fila.querySelector(".editable-conductor");
        const celdaEnc = fila.querySelector(".editable-encuentro");

        // Guardamos valores para no perderlos
        const condActual = celdaCond.innerText;
        const encActual = celdaEnc.innerText === '---' ? '' : celdaEnc.innerText;

        // Convertimos a inputs
        celdaCond.innerHTML = `<input type="text" class="form-input text-sm" value="${condActual}">`;
        celdaEnc.innerHTML = `<input type="text" class="form-input text-sm" value="${encActual}">`;

        // Cambiamos el botón de Editar por Guardar y Cancelar
        const celdaAcciones = fila.querySelector("td:last-child");
        celdaAcciones.innerHTML = `
            <div class="flex gap-2">
                <button onclick="UI.guardarCambios(${id})" class="btn-primary-sm" style="padding:4px 8px">💾</button>
                <button onclick="UI.cargarYMostrarAgenda()" class="btn-secondary-sm" style="padding:4px 8px">❌</button>
            </div>
        `;
    },

    async guardarCambios(id) {
        const fila = document.querySelector(`tr[data-id="${id}"]`);
        const nuevoCond = fila.querySelector(".editable-conductor input").value;
        const nuevoEnc = fila.querySelector(".editable-encuentro input").value;

        try {
            // Este método debe estar en tu infrastructure/api/api.js
            await Api.actualizarSalida(id, {
                conductor: nuevoCond,
                punto_encuentro: nuevoEnc
            });
            this.mostrarMensaje("Cambios guardados", "success");
            this.cargarYMostrarAgenda(); // Recargar tabla
        } catch (error) {
            this.mostrarMensaje("Error al guardar", "error");
        }
    }, 

    async desactivarSalida(id) {
        if (!confirm("¿Estás seguro de quitar esta salida de la agenda?")) return;

        try {
            // Hacemos un patch enviando activo: false
            await Api.actualizarSalida(id, { activo: false });

            this.mostrarMensaje("Salida removida del historial", "success");
            this.cargarYMostrarAgenda(); // Refrescamos la tabla y ya no aparecerá
        } catch (error) {
            this.mostrarMensaje("Error al intentar desactivar", "error");
        }
    }

    
};

export const AgendaUI = {
    renderHistorial: (container, datos) => {
        if (!datos || datos.length === 0) {
            container.innerHTML = `
                <div class="py-20 text-center">
                    <p class="text-gray-400 font-medium">No hay registros de planificación en este período.</p>
                </div>`;
            return;
        }

        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Territorio</th>
                        <th>Fecha</th>
                        <th>Turno</th>
                        <th>Responsable / Conductor</th>
                        <th>Punto de Encuentro</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        datos.forEach(s => {
            // Formatear fecha de ISO a algo legible: 25 Abr, 2026
            const fechaLegible = new Date(s.fecha).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'short'
            });

            html += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td>
                        <span class="font-mono font-bold text-green-700 bg-green-50 px-2 py-1 rounded">
                            #${String(s.territorio_id).padStart(2, '0')}
                        </span>
                    </td>
                    <td class="text-gray-600 font-medium">${fechaLegible}</td>
                    <td>
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-gray-200 text-gray-500">
                            ${s.turno}
                        </span>
                    </td>
                    <td class="font-medium text-gray-900">${s.conductor || 'Sin asignar'}</td>
                    <td class="text-gray-500 text-xs italic">${s.punto_encuentro || 'A coordinar'}</td>
                    <td class="text-right">
                        <div class="flex justify-end gap-2">
                            <button onclick="gestionarEdicion(${s.id})" class="text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md border border-gray-200 bg-white hover:border-gray-400 transition-all">
                                Gestionar
                            </button>
                            <button onclick="confirmarBaja(${s.id})" class="text-xs font-semibold text-red-600 hover:text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-all">
                                Dar de baja
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
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