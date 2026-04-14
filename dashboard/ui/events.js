// frontend/dashboard/ui/events.js
import { Modals } from "./modals.js";

export function initGlobalEvents() {
    console.log("Sistema de eventos UI inicializado");

    // Delegación de eventos para clicks
    document.addEventListener("click", (e) => {
        // --- NUEVO: Capturar el botón de generar ---
        const btnGenerar = e.target.closest("#btnGenerarPropuesta");
        if (btnGenerar) {
            window.UI.manejarGenerarAgenda(); // Usamos window.UI para ir sobre seguro con Vite
            return;
        }

        const btnEdit = e.target.closest(".btn-row-edit");
        const btnDelete = e.target.closest(".btn-row-delete");
        
        // --- LÓGICA DE EDICIÓN ---
        if (btnEdit) {
            e.preventDefault();
            Modals.abrirEdicion({
                id: btnEdit.dataset.id,
                conductor: btnEdit.dataset.conductor,
                fecha_asignado: btnEdit.dataset.fechaAsignado,
                fecha_completado: btnEdit.dataset.fechaCompletado,
                cantidad_abarcado: btnEdit.dataset.cantidad
            });
        }

        // --- LÓGICA DE ELIMINACIÓN ---
        if (btnDelete) {
            e.preventDefault();
            const id = btnDelete.dataset.id;
            const fila = btnDelete.closest("tr");
            const fechaTxt = fila.querySelectorAll("td")[1].innerText;
            const conductor = fila.querySelectorAll("td")[0].innerText;
            Modals.abrirConfirmarEliminacion(id, conductor, fechaTxt);
        }

        // --- CIERRE DE MODALES ---
        if (e.target.closest(".btn-close-modal") || e.target.classList.contains("modal-overlay")) {
            Modals.cerrarEdicion();
            Modals.cerrarConfirmar();
        }
    });

    // --- LÓGICA DE CANCELACIÓN (Aislada) ---
    const btnCancelEdit = document.getElementById("btnCancelEdit");
    if (btnCancelEdit) btnCancelEdit.onclick = (e) => { e.preventDefault(); Modals.cerrarEdicion(); };

    const btnCancelDelete = document.getElementById("btnCancelDelete");
    if (btnCancelDelete) btnCancelDelete.onclick = (e) => { e.preventDefault(); Modals.cerrarConfirmar(); };
}