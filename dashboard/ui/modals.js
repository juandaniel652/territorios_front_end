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
    },

    abrirSesionExpirada() {
        // Evitamos duplicar el modal si ya existe en pantalla
        if (document.getElementById("modalSesionExpirada")) return;

        // Limpiamos los tokens locales para evitar bucles de reintento fallidos
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");

        // Creamos la estructura del modal al vuelo de forma limpia y sobria
        const modalHtml = `
            <div id="modalSesionExpirada" class="modal-overlay" style="z-index: 9999; display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);">
                <div class="modal-card" style="max-width: 400px; text-align: center; padding: 2rem; border-radius: 12px; background: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
                    <div style="font-size: 3rem; margin-bottom: 1rem; filter: grayscale(0.2);">🔒</div>
                    <h3 style="margin: 0 0 0.75rem 0; font-family: 'Playfair Display', serif; color: #1e293b; font-size: 1.5rem;">Tu sesión ha expirado</h3>
                    <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5;">
                        Por razones de seguridad, tu sesión finalizó. Por favor, iniciá sesión nuevamente para poder guardar tus cambios.
                    </p>
                    <button id="btnReconectar" class="btn-primary-sm" style="width: 100%; background: var(--green-600); padding: 0.75rem; font-weight: 600; border-radius: 6px; color: #fff; border: none; cursor: pointer; transition: background 0.2s;">
                        Iniciar Sesión
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML("beforeend", modalHtml);

        // Añadimos el evento para redireccionar al login de forma prolija
        document.getElementById("btnReconectar").addEventListener("click", () => {
            window.location.href = "frontend/login/index.html"; 
        });

        // Redirección automática de cortesía tras 6 segundos por si dejó la compu sola
        setTimeout(() => {
            window.location.href = "/login/";
        }, 6000);
    }
};

// Función auxiliar para convertir YYYY-MM-DD a DD/MM/AAAA de forma limpia
function formatearFechaA_AR(fechaISO) {
    if (!fechaISO) return "";
    const partes = fechaISO.split("-"); // [YYYY, MM, DD]
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`; // DD/MM/AAAA
}