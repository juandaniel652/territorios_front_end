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
        const contenedor = document.getElementById("containerAgendaGuardada");
        try {
            contenedor.innerHTML = `<div class="p-10 text-center text-green-600">Cargando agenda...</div>`;
            
            // Ahora Api tiene AMBOS nombres, no va a fallar
            const agenda = await Api.obtenerSalidasQuincena(); 
            
            window.agendaActual = agenda; 
            this.renderizarTablaHistorial(agenda); // Esta es la de las 4 columnas
        } catch (error) {
            console.error("Error al cargar agenda:", error);
            contenedor.innerHTML = `<div class="p-4 text-red-500 bg-red-50 rounded-lg text-center">Error al conectar con el servidor.</div>`;
        }
    },

    renderizarTablaHistorial(agenda) {
        const contenedor = document.getElementById("containerAgendaGuardada");
        
        if (!agenda || agenda.length === 0) {
            contenedor.innerHTML = `<div class="py-12 text-center text-gray-400">No hay historial.</div>`;
            return;
        }
    
        let html = '';
        let semanaActual = null;
    
        agenda.forEach((item, index) => {
            // --- LÓGICA DE AGRUPACIÓN SEMANAL ---
            const fechaObj = new Date(item.fecha + 'T00:00:00');
            
            // Calculamos el lunes y domingo de la semana de este item
            const diaSemana = fechaObj.getDay(); // 0 es domingo, 1 lunes...
            const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
            
            const lunes = new Date(fechaObj);
            lunes.setDate(fechaObj.getDate() + diffLunes);
            const domingo = new Date(lunes);
            domingo.setDate(lunes.getDate() + 6);
        
            const rangoSemana = `Semana del ${lunes.getDate()} de ${lunes.toLocaleString('es-AR', {month:'long'})} al ${domingo.getDate()} de ${domingo.toLocaleString('es-AR', {month:'long'})} ${domingo.getFullYear()}`;
        
            // Si la semana cambió, cerramos la tabla anterior (si existe) y abrimos un nuevo bloque
            if (semanaActual !== rangoSemana) {
                if (semanaActual !== null) html += `</tbody></table></div></div>`; // Cerrar bloque anterior
                
                semanaActual = rangoSemana;
                
                html += `
                    <div class="mb-10">
                        <div class="bg-gray-100 px-4 py-2 rounded-t-lg border-x border-t border-gray-200">
                            <span class="text-sm font-bold text-gray-600 uppercase tracking-widest">📅 ${rangoSemana}</span>
                        </div>
                        <div class="overflow-hidden rounded-b-xl border border-gray-200 bg-white shadow-sm">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-gray-50 text-gray-500 border-b border-gray-200">
                                        <th class="p-3 text-[10px] font-bold uppercase w-1/4">Día y Turno</th>
                                        <th class="p-3 text-[10px] font-bold uppercase w-1/4">Punto de Encuentro</th>
                                        <th class="p-3 text-[10px] font-bold uppercase w-1/6 text-center">Territorio</th>
                                        <th class="p-3 text-[10px] font-bold uppercase w-1/4">Conductor</th>
                                        <th class="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100">
                `;
            }
        
            // --- RENDERIZADO DE FILA ---
            const nombreDia = fechaObj.toLocaleDateString('es-AR', { weekday: 'long' });
            const esAM = item.turno === 'AM';
        
            html += `
                <tr class="hover:bg-blue-50/30 transition-colors group" data-id="${item.id}">
                    <td class="p-4">
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-gray-800 capitalize">${nombreDia}</span>
                            <span class="text-[10px] font-black tracking-tighter ${esAM ? 'text-blue-500' : 'text-indigo-700'}">
                                ${esAM ? '☀️ MAÑANA (AM)' : '🌙 TARDE (PM)'}
                            </span>
                        </div>
                    </td>
                    <td class="p-4">
                        <span class="text-sm text-gray-600 editable-encuentro">${item.punto_encuentro || 'A confirmar'}</span>
                    </td>
                    <td class="p-4 text-center">
                        <span class="inline-block bg-gray-50 text-gray-700 px-3 py-1 rounded border border-gray-200 font-mono font-bold">
                            #${String(item.territorio_id).padStart(2, '0')}
                        </span>
                    </td>
                    <td class="p-4">
                        <span class="text-sm font-medium text-gray-700 editable-conductor">${item.conductor_nombre || 'Sin asignar'}</span>
                    </td>
                    <td class="p-4 text-right">
                        <button onclick="UI.activarEdicion(${item.id})" class="text-gray-400 hover:text-blue-600 p-1">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                    </td>
                </tr>
            `;
        });
    
        html += `</tbody></table></div></div>`; // Cerrar el último bloque
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