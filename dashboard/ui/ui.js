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

    // Escuchamos en el document para que sea infalible
    document.addEventListener("click", (e) => {
        const btnEdit = e.target.closest(".btn-row-edit");
        const btnDelete = e.target.closest(".btn-row-delete");

        if (btnEdit) {
            e.preventDefault();
            if (btnEdit.disabled) return;

            // IMPORTANTE: Asegúrate de que los nombres coincidan con los data-attributes
            UI.abrirModalEdicion({
                id: btnEdit.dataset.id,
                conductor: btnEdit.dataset.conductor,
                fecha_asignado: btnEdit.dataset.fechaAsignado, // data-fecha-asignado
                fecha_completado: btnEdit.dataset.fechaCompletado, // data-fecha-completado
                cantidad_abarcado: btnEdit.dataset.cantidad, // data-cantidad
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
        DOM.mensaje.className = tipo === "success" ? "msg-success" : "msg-error";
        setTimeout(() => { 
            DOM.mensaje.textContent = ""; 
            DOM.mensaje.className = ""; 
        }, 4000);
    },

    // ── Lógica de Modales ──────────────────────────────────────────────────

    abrirModalEdicion(data) {
        const modal = document.getElementById("modalEdicion");
        document.getElementById("editId").value             = data.id;
        document.getElementById("editConductor").value      = data.conductor;
        document.getElementById("editFechaAsignado").value  = data.fecha_asignado;
        document.getElementById("editFechaCompletado").value= data.fecha_completado;
        document.getElementById("editCantidad").value       = data.cantidad_abarcado;
        modal.style.display = "flex";          // ← style directo, no classList
    },

    cerrarModalEdicion() {
        document.getElementById("modalEdicion").style.display = "none";
        document.getElementById("formEdicion").reset();
    },
    
    confirmarEliminacion(id) {
        document.getElementById("confirmDeleteId").value    = id;
        document.getElementById("modalConfirm").style.display = "flex";
    },
    
    cerrarModalConfirm() {
        document.getElementById("modalConfirm").style.display = "none";
    },

    // ── Renderizado de Tablas ──────────────────────────────────────────────

    renderAsignaciones(numero, asignaciones) {
        console.log("Asignaciones recibidas:", asignaciones);
        // Llamamos a la delegación aquí para asegurar que se active 
        // la primera vez que se muestra una tabla
        registrarDelegacion();

        if (!asignaciones.length) {
            // Usamos el ID directo para evitar problemas de referencia en el objeto DOM
            const container = document.getElementById("resultadoTerritorio");
            if (container) {
                container.innerHTML = `<p class="result-empty">Sin asignaciones para el territorio <strong>${numero}</strong>.</p>`;
            }
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

        const container = document.getElementById("resultadoTerritorio");
        if (container) {
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
        }
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