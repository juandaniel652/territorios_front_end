// frontend/dashboard/ui/events.js
import { Modals } from "./modals.js";

export function initGlobalEvents() {
    console.log("✅ Sistema de eventos UI inicializado");

    // --- DELEGACIÓN DE EVENTOS ÚNICA PARA CLICKS ---
    document.addEventListener("click", (e) => {
        const target = e.target;

        // 1. Manejo de Navegación (Sidebar)
        // Buscamos si el click fue en un botón de navegación
        const btnNav = target.closest(".nav-btn");
        if (btnNav) {
            // Extraemos el ID de la sección (ej: btnAgenda -> seccionAgenda)
            const sectionId = btnNav.id.replace('btn', 'seccion');
            const targetSection = document.getElementById(sectionId);

            if (targetSection) {
                // Ocultar todas las secciones
                document.querySelectorAll('.section-base').forEach(s => s.classList.add('hidden'));
                // Mostrar la elegida
                targetSection.classList.remove('hidden');
                targetSection.classList.add('animate-in');
                
                // Actualizar Header (Opcional, pero recomendado para feedback visual)
                const headerTitle = document.getElementById('headerTitle');
                if (headerTitle) headerTitle.innerText = btnNav.innerText.trim();
            }
        }

        // 2. Navegación específica a Agenda (Carga de datos)
        const btnVerAgenda = target.closest("#btnAgenda, #btnVerAgendaGuardada");
        if (btnVerAgenda) {
            if (window.UI && window.UI.verAgendaGuardada) {
                try {
                    window.UI.verAgendaGuardada();
                } catch (err) {
                    console.error("❌ Error al cargar la agenda guardada:", err);
                }
            } else {
                console.warn("⚠️ window.UI.verAgendaGuardada no está lista");
            }
        }

        // 3. Generar Propuesta
        const btnGenerar = target.closest("#btnGenerarPropuesta");
        if (btnGenerar) {
            window.UI?.manejarGenerarAgenda?.();
            return;
        }

        // 4. Confirmar Agenda
        const btnConfirmar = target.closest("#btnConfirmarAgenda");
        if (btnConfirmar) {
            window.UI?.manejarConfirmarAgenda?.();
            setTimeout(() => window.UI?.verAgendaGuardada?.(), 800);
            return;
        }

        // 5. Lógica de Modales (Editar)
        const btnEdit = target.closest(".btn-row-edit");
        if (btnEdit) {
            e.preventDefault();
            Modals.abrirEdicion({
                id: btnEdit.dataset.id,
                conductor: btnEdit.dataset.conductor,
                fecha_asignado: btnEdit.dataset.fechaAsignado,
                fecha_completado: btnEdit.dataset.fechaCompletado,
                cantidad_abarcado: btnEdit.dataset.cantidad
            });
            return;
        }

        // 6. Lógica de Eliminación
        const btnDelete = target.closest(".btn-row-delete");
        if (btnDelete) {
            e.preventDefault();
            const id = btnDelete.dataset.id;
            const fila = btnDelete.closest("tr");
            const fechaTxt = fila?.querySelectorAll("td")[1]?.innerText || "Fecha desconocida";
            const conductor = fila?.querySelectorAll("td")[0]?.innerText || "Sin nombre";
            Modals.abrirConfirmarEliminacion(id, conductor, fechaTxt);
            return;
        }

        // 7. Cierre de Modales (Overlay o X)
        if (target.closest(".btn-close-modal") || target.classList.contains("modal-overlay")) {
            Modals.cerrarEdicion();
            Modals.cerrarConfirmar();
        }
    });

    // --- LÓGICA DE INTERCAMBIO DE TERRITORIOS (Focus & Change) ---
    document.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('territory-input')) {
            e.target.dataset.oldValue = e.target.value;
        }
    });

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('territory-input')) {
            const nuevoValor = e.target.value;
            const viejoValor = e.target.dataset.oldValue;
            const tablaPadre = e.target.closest('table'); 

            if (!tablaPadre) return;

            const otroInput = Array.from(tablaPadre.querySelectorAll('.territory-input'))
                .find(input => input !== e.target && input.value === nuevoValor);

            if (otroInput) {
                otroInput.value = viejoValor;
                otroInput.classList.add('bg-yellow-100');
                setTimeout(() => otroInput.classList.remove('bg-yellow-100'), 500);
            }
        }
    });

    // --- BOTONES DE CANCELACIÓN ---
    document.getElementById("btnCancelEdit")?.addEventListener("click", (e) => {
        e.preventDefault();
        Modals.cerrarEdicion();
    });

    document.getElementById("btnCancelDelete")?.addEventListener("click", (e) => {
        e.preventDefault();
        Modals.cerrarConfirmar();
    });
}