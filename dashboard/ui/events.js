// frontend/dashboard/ui/events.js
import { Modals } from "./modals.js";

export function initGlobalEvents() {
    console.log("🚀 Sistema de eventos UI inicializado con IDs reales");

    document.addEventListener("click", (e) => {
        const target = e.target;

        // 1. LOGOUT (ID real: btnLogout)
        if (target.closest("#btnLogout")) {
            console.log("👋 Cerrando sesión...");
            localStorage.removeItem("token");
            window.location.href = "../login/index.html";
            return;
        }

        // 2. NAVEGACIÓN (IDs reales: btnDashboard, btnAgregar, btnConsultar, etc.)
        const btnNav = target.closest(".nav-btn");
        if (btnNav) {
            // REGLA CANÓNICA: btnX -> seccionX
            const sectionId = btnNav.id.replace('btn', 'seccion');
            const targetSection = document.getElementById(sectionId);
        
            if (targetSection) {
                // 1. Ocultar TODAS las que empiecen con "seccion"
                document.querySelectorAll('section[id^="seccion"]').forEach(s => s.classList.add('hidden'));
                
                // 2. Mostrar la elegida
                targetSection.classList.remove('hidden');
                targetSection.classList.add('animate-in'); // Tu animación de CSS
            
                // 3. Actualizar el Header (usando el texto del botón)
                const titulo = btnNav.innerText.trim();
                document.getElementById("headerTitle").textContent = titulo;
            }
        }

        // 3. GENERAR PROPUESTA (ID real: btnGenerarPropuesta)
        if (target.closest("#btnGenerarPropuesta")) {
            console.log("🛠️ Generando propuesta...");
            window.UI?.manejarGenerarAgenda?.();
            return;
        }

        // 4. CONFIRMAR (ID real: btnConfirmarAgenda)
        if (target.closest("#btnConfirmarAgenda")) {
            console.log("💾 Confirmando agenda...");
            window.UI?.manejarConfirmarAgenda?.();
            return;
        }

        // 5. MODALES (Editar/Eliminar)
        const btnEdit = target.closest(".btn-row-edit");
        if (btnEdit) {
            Modals.abrirEdicion({
                id: btnEdit.dataset.id,
                conductor: btnEdit.dataset.conductor,
                fecha_asignado: btnEdit.dataset.fechaAsignado,
                fecha_completado: btnEdit.dataset.fechaCompletado,
                cantidad_abarcado: btnEdit.dataset.cantidad
            });
        }

        // 6. CIERRE DE MODALES (IDs reales: btnCancelEdit, btnCancelDelete)
        if (target.closest("#btnCancelEdit, #btnCancelDelete, .btn-close-modal, .modal-overlay")) {
            Modals.cerrarEdicion();
            Modals.cerrarConfirmar();
        }
    });
}