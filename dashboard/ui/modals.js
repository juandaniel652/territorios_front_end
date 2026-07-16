export const Modals = {
    abrirEdicion(data) {
        const modal = document.getElementById("modalEdicion");
        if (!modal) return;
        
        console.log("✏️ Abriendo edición con datos recibidos de la fila:", data);
        
        // Seteamos valores básicos
        const inputId = document.getElementById("editId");
        const inputConductor = document.getElementById("editConductor");
        const inputTerritorio = document.getElementById("editTerritorio");
        
        // CORRECCIÓN CLAVE: Apuntamos a 'editCantidad' que es el ID real en el HTML del modal
        const inputCantidad = document.getElementById("editCantidad");
        
        if (inputId) inputId.value = data.id || "";
        if (inputConductor) inputConductor.value = data.conductor || "";
        if (inputTerritorio) {
            inputTerritorio.value = data.numero_territorio || data.numeroTerritorio || data.numero || "";
        }
        
        // RECUPERAR CANTIDAD ABARCADA
        if (inputCantidad) {
            // Buscamos todas las variantes de nombre con las que pueda venir desde tu base de datos/backend
            inputCantidad.value = data.cantidad_abarcada || data.cantidadAbarcado || data.cantidad_abarcado || data.cantidad || "";
        }
        
        const inputAsignado = document.getElementById("editFechaAsignado");
        const inputCompletado = document.getElementById("editFechaCompletado");
        
        // 💡 Normalizamos las fechas tolerando camelCase y guion_bajo
        const rawAsignado = data.fecha_asignado || data.fechaAsignado || "";
        const rawCompletado = data.fecha_completado || data.fechaCompletado || "";

        // Limpiamos el formato ISO de la base de datos (se queda solo con YYYY-MM-DD)
        const fechaAsignadoLimpia = rawAsignado.split("T")[0];
        const fechaCompletadoLimpia = rawCompletado.split("T")[0];

        // 🇦🇷 Cargamos las fechas formateadas directamente como texto simple en DD/MM/AAAA
        if (inputAsignado) {
            inputAsignado.value = formatearFechaA_AR(fechaAsignadoLimpia);
        }

        if (inputCompletado) {
            inputCompletado.value = formatearFechaA_AR(fechaCompletadoLimpia);
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

// Función auxiliar para convertir YYYY-MM-DD a DD/MM/AAAA de forma limpia
function formatearFechaA_AR(fechaISO) {
    if (!fechaISO) return "";
    const partes = fechaISO.split("-"); // [YYYY, MM, DD]
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`; // DD/MM/AAAA
}