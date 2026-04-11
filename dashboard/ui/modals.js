export const Modals = {
    abrirEdicion(data) {
        const modal = document.getElementById("modalEdicion");
        if (!modal) return;
        
        document.getElementById("editId").value = data.id || "";
        document.getElementById("editConductor").value = data.conductor || "";
        
        // Seteamos el valor en los inputs
        const inputAsignado = document.getElementById("editFechaAsignado");
        const inputCompletado = document.getElementById("editFechaCompletado");
        
        inputAsignado.value = data.fecha_asignado || "";
        inputCompletado.value = data.fecha_completado || "";
        document.getElementById("editCantidad").value = data.cantidad_abarcado || "";

        // RE-INICIALIZAR FLATPICKR para que lea los nuevos valores
        // Esto hace que el calendario se abra en la fecha correcta
        inputAsignado._flatpickr.setDate(data.fecha_asignado);
        inputCompletado._flatpickr.setDate(data.fecha_completado);
        
        modal.classList.remove("hidden");
        document.getElementById("editConductor").focus();
    },

    cerrarEdicion() {
        const modal = document.getElementById("modalEdicion");
        if (modal) modal.classList.add("hidden");
    },

    abrirConfirmarEliminacion(id, conductor, fecha) {
        const modal = document.getElementById("modalConfirm");
        if (!modal) return;
        
        // Buscamos un elemento donde mostrar el resumen (si no existe, lo crea)
        let info = modal.querySelector(".confirm-info");
        if (!info) {
            const p = document.createElement("p");
            p.className = "confirm-info";
            p.style.margin = "10px 0";
            p.style.fontSize = "0.9em";
            p.style.color = "#ccc";
            modal.querySelector(".modal-content").insertBefore(p, document.getElementById("confirmDeleteId").parentNode);
            info = p;
        }

        document.getElementById("confirmDeleteId").value = id;
        info.innerHTML = `Vas a eliminar la asignación de <strong>${conductor}</strong> del día <strong>${fecha}</strong>.`;
        
        modal.classList.remove("hidden");
    },

    cerrarConfirmar() {
        const modal = document.getElementById("modalConfirm");
        if (modal) modal.classList.add("hidden");
    }
};