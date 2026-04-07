// ui/ui.js
import { DOM } from "./dom.js";

let chartInstance = null;
let delegacionActiva = false;

export let onAsignacionModificada = () => {};
export function setOnAsignacionModificada(fn) { onAsignacionModificada = fn; }

function registrarDelegacion() {
    if (delegacionActiva) return;
    delegacionActiva = true;

    document.addEventListener("click", (e) => {
        const btnEdit   = e.target.closest(".btn-row-edit");
        const btnDelete = e.target.closest(".btn-row-delete");

        if (btnEdit) {
            e.preventDefault();
            if (btnEdit.disabled) return;
            UI.abrirModalEdicion({
                id:                btnEdit.dataset.id,
                conductor:         btnEdit.dataset.conductor,
                fecha_asignado:    btnEdit.dataset.fechaAsignado,
                fecha_completado:  btnEdit.dataset.fechaCompletado,
                cantidad_abarcado: btnEdit.dataset.cantidad,
            });
        }

        if (btnDelete) {
            e.preventDefault();
            if (btnDelete.disabled) return;
            UI.confirmarEliminacion(btnDelete.dataset.id);
        }
    });
}

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
        setTimeout(() => {
            DOM.mensaje.textContent = "";
            DOM.mensaje.className   = "";
        }, 4000);
    },

    // ── Modales ───────────────────────────────────────────────────────────

    abrirModalEdicion(data) {
        const modal = document.getElementById("modalEdicion");
        if (!modal) return;

        document.getElementById("editId").value              = data.id ?? "";
        document.getElementById("editConductor").value       = data.conductor ?? "";
        document.getElementById("editFechaAsignado").value   = data.fecha_asignado ?? "";
        document.getElementById("editFechaCompletado").value = data.fecha_completado ?? "";
        document.getElementById("editId").value              = data.id ?? "";
        document.getElementById("editCantidad").value        = data.cantidad_abarcado ?? "";

        // CAMBIO: Usar classList en lugar de style
        modal.classList.remove("hidden");
        document.getElementById("editConductor").focus();
    },

    cerrarModalEdicion() {
        const modal = document.getElementById("modalEdicion");
        if (modal) modal.classList.add("hidden");
        document.getElementById("formEdicion").reset();
    },

    confirmarEliminacion(id) {
        const modal = document.getElementById("modalConfirm");
        if (!modal) return;
        document.getElementById("confirmDeleteId").value = id;
        // CAMBIO: Usar classList
        modal.classList.remove("hidden");
    },

    cerrarModalConfirm() {
        const modal = document.getElementById("modalConfirm");
        if (modal) modal.classList.add("hidden");
    },

    // ── Tablas ────────────────────────────────────────────────────────────

    renderAsignaciones(numero, asignaciones) {
        registrarDelegacion();

        const container = document.getElementById("resultadoTerritorio");
        if (!container) return;

        if (!asignaciones.length) {
            container.innerHTML = `<p class="result-empty">Sin asignaciones para el territorio <strong>${numero}</strong>.</p>`;
            return;
        }

        const filas = asignaciones.map(a => {
            const id      = a.id ?? null;
            const tieneId = id !== null && id !== undefined && id !== "";
            return `
            <tr>
                <td>${a.conductor         ?? "—"}</td>
                <td>${a.fecha_asignado    ?? "—"}</td>
                <td>${a.fecha_completado  ?? "—"}</td>
                <td>${a.cantidad_abarcado ?? "—"}</td>
                <td>
                    <div class="row-actions">
                        <button class="btn-row-edit"
                            data-id="${id}"
                            data-conductor="${a.conductor ?? ""}"
                            data-fecha-asignado="${a.fecha_asignado ?? ""}"
                            data-fecha-completado="${a.fecha_completado ?? ""}"
                            data-cantidad="${a.cantidad_abarcado ?? ""}"
                            ${!tieneId ? "disabled" : ""}>
                            Editar
                        </button>
                        <button class="btn-row-delete"
                            data-id="${id}"
                            ${!tieneId ? "disabled" : ""}>
                            Eliminar
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join("");

        container.innerHTML = `
            <h4 class="result-title">Historial: Territorio ${numero}</h4>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Conductor</th>
                            <th>Asignado</th>
                            <th>Completado</th>
                            <th>Abarcado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    },

    // ── Dashboard ─────────────────────────────────────────────────────────

    renderDashboard(stats) {
        document.getElementById("totalAsignaciones").textContent      = stats.total_asignaciones;
        document.getElementById("territoriosActivos").textContent     = stats.territorios_activos;
        document.getElementById("asignacionesCompletadas").textContent = stats.asignaciones_completadas;

        const ctx = document.getElementById("asignacionesChart").getContext("2d");
        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: stats.chart_data.labels,
                datasets: [{
                    label: "Asignaciones",
                    data: stats.chart_data.values,
                    backgroundColor: "#22c55e",
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: "#eef0f5" } },
                    x: { grid: { display: false } }
                }
            }
        });
    },

    // ── Sugerencias ───────────────────────────────────────────────────────

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
    },
};