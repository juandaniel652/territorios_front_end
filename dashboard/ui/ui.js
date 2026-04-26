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

            if (agenda.length === 0) {
                contenedor.innerHTML = "<p class='text-center'>No hay agenda guardada aún.</p>";
                return;
            }

            let html = `
                <div class="overflow-x-auto">
                    <table class="table w-full bg-base-200 shadow-xl rounded-lg">
                        <thead>
                            <tr class="bg-primary text-white">
                                <th>Fecha</th>
                                <th>Turno</th>
                                <th>Territorio</th>
                                <th>Conductor</th>
                                <th>Punto de Encuentro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            agenda.forEach(item => {
                html += `
                    <tr data-id="${item.id}">
                        <td>${item.fecha}</td>
                        <td><span class="badge badge-ghost">${item.turno}</span></td>
                        <td><strong>#${item.territorio_id}</strong></td>
                        <td class="editable-conductor">${item.conductor}</td>
                        <td class="editable-encuentro">${item.punto_encuentro || '---'}</td>
                        <td>
                            <div class="flex gap-2">
                                <!-- Cambiado ui a UI para que coincida con el objeto global -->
                                <button onclick="UI.activarEdicion(${item.id})" class="btn btn-sm btn-outline btn-info">✏️</button>
                                <!-- Agregamos el botón de Soft Delete -->
                                <button onclick="UI.desactivarSalida(${item.id})" class="btn btn-sm btn-outline btn-error">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            html += `</tbody></table></div>`;
            contenedor.innerHTML = html;

        } catch (error) {
            console.error("Error al cargar agenda:", error);
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