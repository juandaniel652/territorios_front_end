// frontend/dashboard/ui/events.js
import { Modals } from "/dashboard/ui/modals.js";

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
            const id = btnDelete.dataset.id;
            // Capturamos la fecha que ya está en la fila de la tabla
            const fila = btnDelete.closest("tr");
            const fechaTxt = fila.querySelectorAll("td")[1].innerText; // La columna 'Asignado'
            const conductor = fila.querySelectorAll("td")[0].innerText;

            console.log("Click en Eliminar capturado, ID:", id);
            Modals.abrirConfirmarEliminacion(id, conductor, fechaTxt);
        }

        // --- CIERRE DE MODALES ---
        if (e.target.closest(".btn-close-modal") || e.target.classList.contains("modal-overlay")) {
            Modals.cerrarEdicion();
            Modals.cerrarConfirmar();
        }

        // CAMBIO AQUÍ: Usamos verificación para evitar el error de "null"
        if (btnCancelEdit) {
    btnCancelEdit.onclick = (e) => {
        e.preventDefault();
        Modals.cerrarEdicion();
    };
    }

    if (btnCancelDelete) {
        btnCancelDelete.onclick = (e) => {
            e.preventDefault();
            Modals.cerrarConfirmar();
        };
    }
    });
}