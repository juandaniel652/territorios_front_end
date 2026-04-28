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
    // Actualizar KPIs
        document.getElementById("totalAsignaciones").textContent = stats.total_asignaciones || 0;
        document.getElementById("territoriosActivos").textContent = stats.territorios_activos || 0;
        document.getElementById("asignacionesCompletadas").textContent = stats.asignaciones_completadas || 0;

        // Renderizar Gráfico
        if (window.Charts) {
            Charts.renderBarChart(
                document.getElementById("asignacionesChart"), 
                stats.chart_data.labels, 
                stats.chart_data.values
            );
        }

        // --- CRÍTICO: MOSTRAR PLANILLA S-13 ---
        const seccionS13 = document.getElementById("seccionPlanillaS13");
        if (seccionS13) {
            seccionS13.classList.remove("hidden"); // Quitamos el candado de visibilidad
            this.renderPlanillaS13(stats.territorios_detalle || []);
        }
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

        flatpickr("#fechaFiltroHistorial", {
            locale: Spanish,
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "F J, Y", // Muestra "Mayo 2026" o similar
            placeholder: "Elegir mes...",
            onChange: (selectedDates, dateStr) => {
                // Esto dispara la búsqueda apenas el usuario elige un mes
                this.verAgendaGuardada();
            }
        });
    },

    // --- NUEVO MÉTODO PARA EL PUNTO 1 ---
    // En ui.js, dentro del objeto UI:
    async manejarGenerarAgenda() {
        const input = document.getElementById("fechaInicioAgenda");
        const contenedor = document.getElementById("containerPropuesta");
        
        if (!input.value) {
            alert("Por favor selecciona una fecha");
            return;
        }
    
        // Limpiar placeholder y poner estado de carga
        contenedor.innerHTML = '<div class="p-10 text-center text-gray-500 animate-pulse">Generando propuesta...</div>';
    
        try {
            // Asumiendo que Preparador es tu lógica de negocio
            const data = await Preparador.obtenerPropuesta(input.value); 
            
            // Renderizar dentro de contenedor (EL DE ARRIBA)
            this.renderTablaPropuesta(data, contenedor); 
        } catch (error) {
            contenedor.innerHTML = '<div class="p-10 text-red-500">Error al generar propuesta.</div>';
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
        const contenedor = document.getElementById("containerAgendaGuardada");
        const filtroFecha = document.getElementById("fechaFiltroHistorial");
        
        // Si el input está vacío, usamos la fecha de hoy
        const fechaParaCargar = filtroFecha.value || new Date().toISOString().split('T')[0];

        try {
            contenedor.innerHTML = `
                <div class="py-12 text-center">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600 mb-4"></div>
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Cargando registros del mes...</p>
                </div>`;

            const agenda = await Api.obtenerSalidasQuincena(fechaParaCargar); 

            window.agendaActual = agenda; 

            if (agenda.length === 0) {
                contenedor.innerHTML = `
                    <div class="py-16 text-center border-2 border-dashed border-gray-100 rounded-xl">
                        <p class="text-gray-400 font-medium">No hay salidas registradas en el mes seleccionado.</p>
                    </div>`;
                return;
            }

            this.renderizarTablaHistorial(agenda);
        } catch (error) {
            console.error("Error al cargar agenda:", error);
            contenedor.innerHTML = `<div class="p-4 text-red-500 text-center">Error al conectar con el servidor.</div>`;
        }
    },

    renderizarTablaHistorial(agenda) {
        // Usamos una constante para el rol
        const esAdmin = localStorage.getItem("role") === "admin";
        const contenedor = document.getElementById("containerAgendaGuardada");
        
        if (!agenda || agenda.length === 0) {
            contenedor.innerHTML = `
                <div class="py-16 text-center border-2 border-dashed border-gray-100 rounded-xl">
                    <p class="text-gray-400 font-medium">No se registran salidas programadas en el historial.</p>
                </div>`;
            return;
        }
    
        let html = '';
        let semanaActual = null;
    
        agenda.forEach((item) => {
            const fechaObj = new Date(item.fecha + 'T00:00:00');
            const diaSemana = fechaObj.getDay(); 
            const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
            const lunes = new Date(fechaObj);
            lunes.setDate(fechaObj.getDate() + diffLunes);
            const domingo = new Date(lunes);
            domingo.setDate(lunes.getDate() + 6);
            
            const mesLunes = lunes.toLocaleString('es-AR', {month:'long'}).toUpperCase();
            const mesDomingo = domingo.toLocaleString('es-AR', {month:'long'}).toUpperCase();
            const rangoSemana = `SEMANA DEL ${lunes.getDate()} DE ${mesLunes} AL ${domingo.getDate()} DE ${mesDomingo}, ${domingo.getFullYear()}`;
        
            if (semanaActual !== rangoSemana) {
                if (semanaActual !== null) html += `</tbody></table></div></div>`; 
                semanaActual = rangoSemana;
            
                html += `
                    <div class="mb-12">
                        <div class="flex items-center mb-3">
                            <div class="h-px flex-grow bg-gray-200"></div>
                            <span class="px-4 text-[11px] font-black text-gray-500 tracking-[0.2em] uppercase">
                                ${rangoSemana}
                            </span>
                            <div class="h-px flex-grow bg-gray-200"></div>
                        </div>
                        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-gray-50 border-b border-gray-200">
                                        <th class="p-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest w-1/4">Día y Turno</th>
                                        <th class="p-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest w-1/4">Punto de Encuentro</th>
                                        <th class="p-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest w-1/6 text-center">Territorio</th>
                                        <th class="p-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest w-1/4">Conductor</th>
                                        ${esAdmin ? '<th class="p-4 w-12 text-right">Acciones</th>' : ''} 
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100">
                `;
            }
        
            const nombreDia = fechaObj.toLocaleDateString('es-AR', { weekday: 'long' });
            const esAM = item.turno === 'AM';
        
            // Solo creamos el HTML de acciones si es admin
            const accionesCelda = esAdmin ? `
                <td class="p-4 text-right">
                    <div class="flex justify-end gap-2">
                        <button onclick="window.gestionarEdicion(${item.id})" class="p-2 text-gray-300 hover:text-green-600 transition-all" title="Editar">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button onclick="window.confirmarBaja(${item.id})" class="p-2 text-gray-300 hover:text-red-600 transition-all" title="Baja">
                             <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </td>` : '';
        
            html += `
                <tr class="hover:bg-green-50/40 transition-colors group" data-id="${item.id}">
                    <td class="p-4 border-l-4 ${esAM ? 'border-green-400' : 'border-emerald-600'}">
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-gray-800 capitalize">${nombreDia}</span>
                            <span class="text-[10px] font-black tracking-widest ${esAM ? 'text-green-600' : 'text-emerald-700'}">TURNO ${item.turno}</span>
                        </div>
                    </td>
                    <td class="p-4 text-sm text-gray-600">${item.punto_encuentro || 'A COORDINAR'}</td>
                    <td class="p-4 text-center">
                        <span class="inline-block bg-green-50 text-green-700 px-3 py-1 rounded border border-green-100 font-mono font-bold text-sm">
                            ${String(item.territorio_id).padStart(2, '0')}
                        </span>
                    </td>
                    <td class="p-4"><span class="text-sm font-semibold text-gray-700 uppercase">${item.conductor_nombre || 'SIN ASIGNAR'}</span></td>
                    ${accionesCelda}
                </tr>
            `;
        });
    
        html += `</tbody></table></div></div>`;
        contenedor.innerHTML = html;
    },

    async cargarYMostrarAgenda() {
        return this.verAgendaGuardada();
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
    },

    // Dentro del objeto UI en ui.js, añade o reemplaza este método:

    renderPlanillaS13(data) {
        const tbody = document.getElementById("tbodyS13");
        if (!tbody) return;
        tbody.innerHTML = "";

        data.forEach(terr => {
            const historial = terr.historial || [];
            let rowHtml = `
                <tr style="border-bottom: 1.5px solid #000; height: 42px;">
                    <td style="border-right: 1.5px solid #000; font-weight: bold; background: #f9fafb;">${String(terr.numero || terr.id).padStart(2, '0')}</td>
                    <td style="border-right: 1.5px solid #000; font-size: 10px;">${terr.ultima_fecha_anterior || '—'}</td>
            `;

            // Generar las 5 columnas de asignación
            for (let i = 0; i < 5; i++) {
                const reg = historial[i];
                const borderStyle = (i === 4) ? '' : 'border-right: 1.5px solid #000;';

                if (reg) {
                    rowHtml += `
                        <td style="border-right: 1px solid #000; font-size: 9px; text-align: left; padding: 2px 4px;">
                            <strong style="display:block;">${reg.conductor}</strong>
                            <span style="color:#666">${reg.fecha_asignado}</span>
                        </td>
                        <td style="${borderStyle} font-size: 9px;">${reg.fecha_completado || ''}</td>
                    `;
                } else {
                    rowHtml += `
                        <td style="border-right: 1px solid #000;"></td>
                        <td style="${borderStyle}"></td>
                    `;
                }
            }
            rowHtml += `</tr>`;
            tbody.innerHTML += rowHtml;
        });
    },
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