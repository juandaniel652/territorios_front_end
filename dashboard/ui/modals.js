export const Modals = {
    abrirEdicion(data) {
        const modal = document.getElementById("modalEdicion");
        if (!modal) return;
        
        document.getElementById("editId").value = data.id || "";
        document.getElementById("editConductor").value = data.conductor || "";
        document.getElementById("editFechaAsignado").value = data.fecha_asignado || "";
        document.getElementById("editFechaCompletado").value = data.fecha_completado || "";
        document.getElementById("editCantidad").value = data.cantidad_abarcado || "";
        
        modal.classList.remove("hidden");
        document.getElementById("editConductor").focus();
    },

    cerrarEdicion() {
        const modal = document.getElementById("modalEdicion");
        if (modal) modal.classList.add("hidden");
    },

    abrirConfirmarEliminacion(id) {
        const modal = document.getElementById("modalConfirm");
        if (!modal) return;
        document.getElementById("confirmDeleteId").value = id;
        modal.classList.remove("hidden");
    },

    cerrarConfirmar() {
        const modal = document.getElementById("modalConfirm");
        if (modal) modal.classList.add("hidden");
    }
};