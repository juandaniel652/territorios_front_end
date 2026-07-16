export const Modals = {
    abrirEdicion(data) {
        const modal = document.getElementById("modalEdicion");
        if (!modal) return;
        
        console.log("✏️ Abriendo edición con datos recibidos de la fila:", data);
        
        // Seteamos valores básicos
        const inputId = document.getElementById("editId");
        const inputConductor = document.getElementById("editConductor");
        const inputCantidad = document.getElementById("editCantidad");
        const inputTerritorio = document.getElementById("editTerritorio"); // Asegúrate de tener este input para el número
        
        if (inputId) inputId.value = data.id || "";
        if (inputConductor) inputConductor.value = data.conductor || "";
        if (inputCantidad) {
            inputCantidad.value = data.cantidad || data.cantidad_abarcado || data.cantidadAbarcado || "";
        }
        if (inputTerritorio) {
            inputTerritorio.value = data.numero_territorio || data.numeroTerritorio || data.numero || "";
        }
        
        const inputAsignado = document.getElementById("editFechaAsignado");
        const inputCompletado = document.getElementById("editFechaCompletado");
        
        // 💡 Normalizamos las fechas tolerando camelCase y guion_bajo
        const rawAsignado = data.fecha_asignado || data.fechaAsignado || "";
        const rawCompletado = data.fecha_completado || data.fechaCompletado || "";

        // Limpiamos la fecha quedándonos solo con la sección YYYY-MM-DD
        const fechaAsignadoLimpia = rawAsignado.split("T")[0];
        const fechaCompletadoLimpia = rawCompletado.split("T")[0];

        // Actualizamos fechas de forma segura en los inputs y en Flatpickr
        if (inputAsignado) {
            inputAsignado.value = fechaAsignadoLimpia;
            if (inputAsignado._flatpickr) {
                inputAsignado._flatpickr.setDate(fechaAsignadoLimpia, false);
            }
        }

        if (inputCompletado) {
            inputCompletado.value = fechaCompletadoLimpia;
            if (inputCompletado._flatpickr) {
                inputCompletado._flatpickr.setDate(fechaCompletadoLimpia, false);
            }
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
        const infoText = document.getElementById("confirmInfoText"); 
        const inputId = document.getElementById("confirmDeleteId");

        if (inputId) inputId.value = id;
        
        if (infoText) {
            infoText.innerHTML = `Vas a eliminar la asignación de <strong>${conductor || "N/A"}</strong> del día <strong>${fecha || "N/A"}</strong>.`;
        }

        if (modal) modal.classList.remove("hidden");
    },

    cerrarConfirmar() {
        const modal = document.getElementById("modalConfirm");
        if (modal) modal.classList.add("hidden");
    }
};