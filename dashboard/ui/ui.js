// ui/ui.js
import { DOM } from "./dom.js";

let chartInstance  = null;
let delegacionActiva = false;  // registrar delegación solo una vez

export let onAsignacionModificada = () => {};
export function setOnAsignacionModificada(fn) { onAsignacionModificada = fn; }

// ── Event delegation: se registra UNA vez sobre el contenedor padre ───────────
// No importa cuándo se inserten los botones — el listener siempre los captura.
function registrarDelegacion() {
    if (delegacionActiva) return;
    delegacionActiva = true;

    DOM.resultadoDiv.addEventListener("click", (e) => {
        const btnEdit   = e.target.closest(".btn-row-edit");
        const btnDelete = e.target.closest(".btn-row-delete");

        if (btnEdit && !btnEdit.disabled) {
            UI.abrirModalEdicion({
                id:               btnEdit.dataset.id,
                conductor:        btnEdit.dataset.conductor,
                fecha_asignado:   btnEdit.dataset.fechaAsignado,
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
        DOM.mensaje.className   = tipo === "success" ? "msg-success" : "msg-error";
        setTimeout(() => { DOM.mensaje.textContent = ""; DOM.mensaje.className = ""; }, 4000);
    },

    renderAsignaciones(numero, asignaciones) {
        // Activar delegación la primera vez que se renderizan resultados
        registrarDelegacion();

        if (!asignaciones.length) {
            DOM.resultadoDiv.innerHTML = `
                <p class="result-empty">Sin asignaciones para el territorio <strong>${numero}</strong>.</p>`;
            return;
        }

        const filas = asignaciones.map(a => {
            const id       = a.id ?? null;
            const tieneId  = id !== null && id !== undefined && id !== "";

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
    },

    abrirModalEdicion(asignacion) {
        console.log("abrirModalEdicion llamado con:", asignacion);
        const modal = document.getElementById("modalEdicion");
        if (!modal) { console.error("Modal #modalEdicion no encontrado"); return; }

        document.getElementById("editId").value              = asignacion.id              ?? "";
        document.getElementById("editConductor").value       = asignacion.conductor       ?? "";
        document.getElementById("editFechaAsignado").value   = asignacion.fecha_asignado  ?? "";
        document.getElementById("editFechaCompletado").value = asignacion.fecha_completado ?? "";
        document.getElementById("editCantidad").value        = asignacion.cantidad_abarcado ?? "";

        modal.classList.remove("hidden");
        document.getElementById("editConductor").focus();
    },

    cerrarModalEdicion() {
        document.getElementById("modalEdicion").classList.add("hidden");
    },

    confirmarEliminacion(id) {
        console.log("confirmarEliminacion llamado con id:", id);
        const modal = document.getElementById("modalConfirm");
        if (!modal) { console.error("Modal #modalConfirm no encontrado"); return; }
        document.getElementById("confirmDeleteId").value = id;
        modal.classList.remove("hidden");
    },

    cerrarModalConfirm() {
        document.getElementById("modalConfirm").classList.add("hidden");
    },

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