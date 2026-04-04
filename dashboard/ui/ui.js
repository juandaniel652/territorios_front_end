// ui/ui.js
import { DOM } from "./dom.js";

let chartInstance = null;
let delegacionActiva = false;

export let onAsignacionModificada = () => {};
export function setOnAsignacionModificada(fn) { onAsignacionModificada = fn; }

/**
 * Registra la delegación de eventos una sola vez.
 * Escucha clicks en el contenedor de resultados para capturar botones de Editar/Eliminar
 * que se generan dinámicamente.
 */
function registrarDelegacion() {
    if (delegacionActiva) return;
    delegacionActiva = true;

    DOM.resultadoDiv.addEventListener("click", (e) => {
        const btnEdit = e.target.closest(".btn-row-edit");
        const btnDelete = e.target.closest(".btn-row-delete");

        if (btnEdit && !btnEdit.disabled) {
            // Nota: dataset.fechaAsignado mapea automáticamente data-fecha-asignado
            UI.abrirModalEdicion({
                id: btnEdit.dataset.id,
                conductor: btnEdit.dataset.conductor,
                fecha_asignado: btnEdit.dataset.fechaAsignado,
                fecha_completado: btnEdit.dataset.fechaCompletado,
                cantidad_abarcado: btnEdit.dataset.cantidad,
            });
        }

        if (btnDelete && !btnDelete.disabled) {
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
        DOM.mensaje.className = tipo === "success" ? "msg-success" : "msg-error";
        setTimeout(() => { 
            DOM.mensaje.textContent = ""; 
            DOM.mensaje.className = ""; 
        }, 4000);
    },

    // ── Lógica de Modales ──────────────────────────────────────────────────

    abrirModalEdicion(data) {
        const modal = document.getElementById("modalEdicion");
        document.getElementById("editId").value = data.id;
        document.getElementById("editConductor").value = data.conductor;
        document.getElementById("editFechaAsignado").value = data.fecha_asignado;
        document.getElementById("editFechaCompletado").value = data.fecha_completado;
        document.getElementById("editCantidad").value = data.cantidad_abarcado;
        
        modal.classList.remove("hidden");
    },

    cerrarModalEdicion() {
        document.getElementById("modalEdicion").classList.add("hidden");
        document.getElementById("formEdicion").reset();
    },

    confirmarEliminacion(id) {
        document.getElementById("confirmDeleteId").value = id;
        document.getElementById("modalConfirm").classList.remove("hidden");
    },

    cerrarModalConfirm() {
        document.getElementById("modalConfirm").classList.add("hidden");
    },

    // ── Renderizado de Tablas ──────────────────────────────────────────────

    renderAsignaciones(numero, asignaciones) {
        registrarDelegacion();

        if (!asignaciones.length) {
            DOM.resultadoDiv.innerHTML = `
                <p class="result-empty">Sin asignaciones para el territorio <strong>${numero}</strong>.</p>`;
            return;
        }

        const filas = asignaciones.map(a => {
            const id = a.id ?? null;
            const tieneId = id !== null && id !== undefined && id !== "";

            return `
            <tr>
                <td>${a.conductor ?? "—"}</td>
                <td>${a.fecha_asignado ?? "—"}</td>
                <td>${a.fecha_completado ?? "—"}</td>
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

        DOM.resultadoDiv.innerHTML = `
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

    // ── Dashboard / Otros ─────────────────────────────────────────────────

    renderDashboard(stats) {
        document.getElementById("totalAsignaciones").textContent = stats.total_asignaciones;
        document.getElementById("territoriosActivos").textContent = stats.territorios_activos;
        document.getElementById("asignacionesCompletadas").textContent = stats.asignaciones_completadas;

        const ctx = document.getElementById("asignacionesChart").getContext("2d");
        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stats.chart_data.labels,
                datasets: [{
                    label: 'Asignaciones',
                    data: stats.chart_data.values,
                    backgroundColor: '#22c55e',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#eef0f5' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
};