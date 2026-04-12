export const Modals = {
    abrirEdicion(data) {
        const modal = document.getElementById("modalEdicion");
        if (!modal) return;
        
        // Seteamos valores básicos
        const inputId = document.getElementById("editId");
        const inputConductor = document.getElementById("editConductor");
        const inputCantidad = document.getElementById("editCantidad");
        
        if (inputId) inputId.value = data.id || "";
        if (inputConductor) inputConductor.value = data.conductor || "";
        if (inputCantidad) inputCantidad.value = data.cantidad_abarcado || "";
        
        const inputAsignado = document.getElementById("editFechaAsignado");
        const inputCompletado = document.getElementById("editFechaCompletado");
        
        // Actualizamos fechas de forma segura
        if (inputAsignado) {
            inputAsignado.value = data.fecha_asignado || "";
            // Solo llamamos a setDate si flatpickr ya se inicializó sobre el elemento
            inputAsignado._flatpickr?.setDate(data.fecha_asignado || "", false);
        }

        if (inputCompletado) {
            inputCompletado.value = data.fecha_completado || "";
            inputCompletado._flatpickr?.setDate(data.fecha_completado || "", false);
        }
        
        modal.classList.remove("hidden");
        inputConductor?.focus();
    },

    cerrarEdicion() {
        const modal = document.getElementById("modalEdicion");
        if (modal) modal.classList.add("hidden");
    },

    abrirConfirmarEliminacion(id, conductor, fecha) {
        const modal = document.getElementById("modalConfirm");
        if (!modal) return;
        
        let info = modal.querySelector(".confirm-info");
        if (!info) {
            const p = document.createElement("p");
            p.className = "confirm-info";
            p.style.margin = "10px 0";
            p.style.fontSize = "0.9em";
            p.style.color = "#ccc";
            const target = document.getElementById("confirmDeleteId")?.parentNode;
            if (target) {
                modal.querySelector(".modal-content").insertBefore(p, target);
            } else {
                modal.querySelector(".modal-content").appendChild(p);
            }
            info = p;
        }

        const inputDeleteId = document.getElementById("confirmDeleteId");
        if (inputDeleteId) inputDeleteId.value = id;
        
        info.innerHTML = `Vas a eliminar la asignación de <strong>${conductor || 'N/A'}</strong> del día <strong>${fecha || 'N/A'}</strong>.`;
        
        modal.classList.remove("hidden");
    },

    cerrarConfirmar() {
        const modal = document.getElementById("modalConfirm");
        if (modal) modal.classList.add("hidden");
    }
};