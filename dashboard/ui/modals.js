export const Modals = {
    abrirEdicion(data) {
        const modal = document.getElementById("modalEdicion");
        if (!modal) return;
        
        console.log("✏️ Abriendo edición con datos recibidos de la fila:", data);
        
        // Seteamos valores básicos
        const inputId = document.getElementById("editId");
        const inputConductor = document.getElementById("editConductor");
        const inputCantidad = document.getElementById("totalAbarcado");
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

        const fechaAsignadoLimpia = rawAsignado.split("T")[0];
        const fechaCompletadoLimpia = rawCompletado.split("T")[0];

        // Configuración regional para inicializar Flatpickr si no existiera en estos inputs
        const flatpickrConfig = {
            dateFormat: "Y-m-d",     // Formato real interno (para el backend)
            altInput: true,          // Habilita el input visual amigable
            altFormat: "d/m/Y",      // 🇦🇷 Formato argentino visual: DD/MM/AAAA
        };

        // Actualizamos Fecha Asignado
        if (inputAsignado) {
            if (inputAsignado._flatpickr) {
                // Si ya es un Flatpickr, le seteamos la fecha directamente y él se encarga de mostrarla en d/m/Y
                inputAsignado._flatpickr.setDate(fechaAsignadoLimpia, false);
            } else {
                // Si es un input plano, inicializamos Flatpickr sobre él
                if (typeof flatpickr !== "undefined") {
                    const fp = flatpickr(inputAsignado, flatpickrConfig);
                    fp.setDate(fechaAsignadoLimpia, false);
                } else {
                    // Fallback rústico si Flatpickr no cargó: convertimos YYYY-MM-DD a DD/MM/AAAA a mano
                    inputAsignado.value = formatearFechaA_AR(fechaAsignadoLimpia);
                }
            }
        }

        // Actualizamos Fecha Completado
        if (inputCompletado) {
            if (inputCompletado._flatpickr) {
                inputCompletado._flatpickr.setDate(fechaCompletadoLimpia, false);
            } else {
                if (typeof flatpickr !== "undefined") {
                    const fp = flatpickr(inputCompletado, flatpickrConfig);
                    fp.setDate(fechaCompletadoLimpia, false);
                } else {
                    inputCompletado.value = formatearFechaA_AR(fechaCompletadoLimpia);
                }
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


function formatearFechaA_AR(fechaISO) {
    if (!fechaISO) return "";
    const partes = fechaISO.split("-"); // [YYYY, MM, DD]
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`; // DD/MM/AAAA
}