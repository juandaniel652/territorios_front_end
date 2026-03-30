// ui/ui.js
import { DOM } from "./dom.js";

let chartInstance = null;

// Callback global que script.js sobreescribe para refrescar la tabla tras editar/eliminar
export let onAsignacionModificada = () => {};
export function setOnAsignacionModificada(fn) { onAsignacionModificada = fn; }

export const UI = {
    limpiarResultados() {
        DOM.resultadoDiv.innerHTML = "";
    },

    mostrarErrorResultados(msg) {
        DOM.resultadoDiv.innerHTML = `
            <div class="result-error">
                <span>⚠</span><p>${msg}</p>
            </div>`;
    },

    mostrarMensaje(texto, tipo = "success") {
        DOM.mensaje.textContent = texto;
        DOM.mensaje.className   = tipo === "success" ? "msg-success" : "msg-error";
        setTimeout(() => { DOM.mensaje.textContent = ""; DOM.mensaje.className = ""; }, 4000);
    },

    // ── renderAsignaciones: corregido + botones editar/eliminar ──────────────
    renderAsignaciones(numero, asignaciones) {
        if (!asignaciones.length) {
            DOM.resultadoDiv.innerHTML = `
                <p class="result-empty">Sin asignaciones para el territorio <strong>${numero}</strong>.</p>`;
            return;
        }

        // BUG FIX: el backend devuelve conductor_nombre y cantidad_abarcado,
        // no conductor ni total_abarcado como estaba antes.
        const filas = asignaciones.map(a => `
            <tr>
                <td>${a.conductor_nombre ?? "—"}</td>
                <td>${a.fecha_asignado   ?? "—"}</td>
                <td>${a.fecha_completado ?? "—"}</td>
                <td>${a.cantidad_abarcado ?? "—"}</td>
                <td>
                    <div class="row-actions">
                        <button class="btn-row-edit"   data-id="${a.id}"
                            data-conductor="${a.conductor_nombre ?? ""}"
                            data-fecha-asignado="${a.fecha_asignado ?? ""}"
                            data-fecha-completado="${a.fecha_completado ?? ""}"
                            data-cantidad="${a.cantidad_abarcado ?? ""}">
                            Editar
                        </button>
                        <button class="btn-row-delete" data-id="${a.id}">
                            Eliminar
                        </button>
                    </div>
                </td>
            </tr>`).join("");

        DOM.resultadoDiv.innerHTML = `
            <p class="result-title">Territorio ${numero}</p>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead><tr>
                        <th>Conductor</th>
                        <th>Asignado</th>
                        <th>Completado</th>
                        <th>Cantidad abarcada</th>
                        <th>Acciones</th>
                    </tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;

        // Delegar eventos a los botones recién insertados
        DOM.resultadoDiv.querySelectorAll(".btn-row-edit").forEach(btn => {
            btn.addEventListener("click", () => {
                UI.abrirModalEdicion({
                    id:               Number(btn.dataset.id),
                    conductor:        btn.dataset.conductor,
                    fecha_asignado:   btn.dataset.fechaAsignado,
                    fecha_completado: btn.dataset.fechaCompletado,
                    cantidad_abarcado: btn.dataset.cantidad,
                });
            });
        });

        DOM.resultadoDiv.querySelectorAll(".btn-row-delete").forEach(btn => {
            btn.addEventListener("click", () => {
                UI.confirmarEliminacion(Number(btn.dataset.id));
            });
        });
    },

    // ── Modal de edición ─────────────────────────────────────────────────────
    abrirModalEdicion(asignacion) {
        // Reutiliza el modal que vive en index.html
        const modal = document.getElementById("modalEdicion");
        document.getElementById("editId").value             = asignacion.id;
        document.getElementById("editConductor").value      = asignacion.conductor;
        document.getElementById("editFechaAsignado").value  = asignacion.fecha_asignado;
        document.getElementById("editFechaCompletado").value = asignacion.fecha_completado;
        document.getElementById("editCantidad").value       = asignacion.cantidad_abarcado;
        modal.classList.remove("hidden");
        document.getElementById("editConductor").focus();
    },

    cerrarModalEdicion() {
        document.getElementById("modalEdicion").classList.add("hidden");
    },

    // ── Confirmación de eliminación ──────────────────────────────────────────
    confirmarEliminacion(id) {
        const modal = document.getElementById("modalConfirm");
        document.getElementById("confirmDeleteId").value = id;
        modal.classList.remove("hidden");
    },

    cerrarModalConfirm() {
        document.getElementById("modalConfirm").classList.add("hidden");
    },

    // ── Sugerencias (sin cambios funcionales, campo corregido) ───────────────
    renderSugerencias(sugerencias) {
        const container = DOM.resultadoSugerencias;
        if (!sugerencias?.length) {
            container.innerHTML = `<p class="result-empty">No hay sugerencias disponibles.</p>`;
            return;
        }
        container.innerHTML = sugerencias.map(s => `
            <div class="sugerencia-card">
                <span class="sugerencia-card__num">T-${s.numero}</span>
                <div class="sugerencia-card__info">
                    <p class="sugerencia-card__last">Última: ${s.ultima_fecha ?? "—"}</p>
                    <p class="sugerencia-card__days">Sin asignar: <strong>${s.dias_atraso ?? "—"} días</strong></p>
                    <p class="sugerencia-card__sev">Severidad: ${s.severidad}</p>
                </div>
            </div>`).join("");
    },

    renderGraficoSugerencias(sugerencias) {
        const canvas = document.getElementById("asignacionesChart");
        if (!canvas || !sugerencias?.length) return;
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(canvas, {
            type: "bar",
            data: {
                labels: sugerencias.map(s => `T-${s.numero}`),
                datasets: [{
                    label: "Días sin asignar",
                    data: sugerencias.map(s => s.dias_atraso ?? 0),
                    backgroundColor: "rgba(34, 197, 94, 0.2)",
                    borderColor: "#16a34a",
                    borderWidth: 2,
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" } }
                }
            }
        });
    }
};