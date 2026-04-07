// frontend/dashboard/ui/events.js
import { Modals } from "./modals.js";

export function initGlobalEvents() {
    console.log("Sistema de eventos UI inicializado");

    document.addEventListener("click", (e) => {
        const btnEdit = e.target.closest(".btn-row-edit");
        const btnDelete = e.target.closest(".btn-row-delete");
        const btnCancelEdit = document.getElementById("btnCancelEdit");
        const btnCancelDelete = document.getElementById("btnCancelDelete");
        
        // --- BOTONES DE LA TABLA ---
        if (btnEdit) {
            e.preventDefault();
            console.log("Click en Editar capturado", btnEdit.dataset);
            Modals.abrirEdicion({
                id: btnEdit.dataset.id,
                conductor: btnEdit.dataset.conductor,
                fecha_asignado: btnEdit.dataset.fechaAsignado,
                fecha_completado: btnEdit.dataset.fechaCompletado,
                cantidad_abarcado: btnEdit.dataset.cantidad
            });
        }

        if (btnDelete) {
            e.preventDefault();
            console.log("Click en Eliminar capturado, ID:", btnDelete.dataset.id);
            Modals.abrirConfirmarEliminacion(btnDelete.dataset.id);
        }

        // --- CIERRE DE MODALES ---
        if (e.target.closest(".btn-close-modal") || e.target.classList.contains("modal-overlay")) {
            Modals.cerrarEdicion();
            Modals.cerrarConfirmar();
        }

        
        if (btnCancelEdit) btnCancelEdit.onclick = () => Modals.cerrarEdicion();  

        if (btnCancelDelete) btnCancelDelete.onclick = () => Modals.cerrarConfirmar();
    });
}