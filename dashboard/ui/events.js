// frontend/dashboard/ui/events.js
import { Modals } from "./modals.js";

export function initGlobalEvents() {
    console.log("Sistema de eventos UI inicializado");

    document.addEventListener("click", (e) => {
        // 1. Navegación a Agenda
        const btnVerAgenda = e.target.closest("#btnAgenda, #btnVerAgendaGuardada");
        if (btnVerAgenda) {
            // Verificamos que window.UI exista antes de llamar
            if (window.UI && window.UI.verAgendaGuardada) {
                window.UI.verAgendaGuardada();
            } else {
                console.warn("⚠️ window.UI.verAgendaGuardada no está lista");
            }
        }

    });

    // --- LÓGICA DE INTERCAMBIO DE TERRITORIOS (Propuesta) ---
    document.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('territory-input')) {
            // Guardamos el valor que tenía antes de ser editado para el intercambio
            e.target.dataset.oldValue = e.target.value;
        }
    });

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('territory-input')) {
            const nuevoValor = e.target.value;
            const viejoValor = e.target.dataset.oldValue;
            const tablaPadre = e.target.closest('table'); 

            if (!tablaPadre) return;

            // Buscamos si el nuevo número ya está en otro input de la misma tabla
            const otroInput = Array.from(tablaPadre.querySelectorAll('.territory-input'))
                .find(input => input !== e.target && input.value === nuevoValor);

            if (otroInput) {
                // 🔄 El otro input toma el valor que este tenía antes
                otroInput.value = viejoValor;

                // Efecto visual de feedback
                otroInput.classList.add('bg-yellow-100');
                setTimeout(() => otroInput.classList.remove('bg-yellow-100'), 500);
            }
        }
    });

    // --- DELEGACIÓN DE EVENTOS PARA CLICKS ---
    document.addEventListener("click", (e) => {
        
        // 1. Navegación a Agenda (Sidebar) o Botón de Refrescar Historial
        const btnVerAgenda = e.target.closest("#btnAgenda, #btnVerAgendaGuardada");
        if (btnVerAgenda) {
            window.UI.verAgendaGuardada();
            // No hacemos return aquí para permitir que otros scripts manejen el cambio de pestaña visual
        }

        // 2. Generar Propuesta (Cálculo lógico)
        const btnGenerar = e.target.closest("#btnGenerarPropuesta");
        if (btnGenerar) {
            window.UI.manejarGenerarAgenda();
            return;
        }

        // 3. Confirmar Agenda (Guardar en Base de Datos)
        const btnConfirmar = e.target.closest("#btnConfirmarAgenda");
        if (btnConfirmar) {
            window.UI.manejarConfirmarAgenda();
            // Refrescamos el historial automáticamente después de un breve delay para que impacte la DB
            setTimeout(() => window.UI.verAgendaGuardada(), 800);
            return;
        }

        // 4. Lógica de Modales (Edición de registros históricos/individuales)
        const btnEdit = e.target.closest(".btn-row-edit");
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

        // 5. Lógica de Eliminación
        const btnDelete = e.target.closest(".btn-row-delete");
        if (btnDelete) {
            e.preventDefault();
            const id = btnDelete.dataset.id;
            const fila = btnDelete.closest("tr");
            const fechaTxt = fila?.querySelectorAll("td")[1]?.innerText || "Fecha desconocida";
            const conductor = fila?.querySelectorAll("td")[0]?.innerText || "Sin nombre";
            Modals.abrirConfirmarEliminacion(id, conductor, fechaTxt);
            return;
        }

        // 6. Cierre de Modales (Overlay o Botón X)
        if (e.target.closest(".btn-close-modal") || e.target.classList.contains("modal-overlay")) {
            Modals.cerrarEdicion();
            Modals.cerrarConfirmar();
        }
    });

    // --- LÓGICA DE BOTONES DE CANCELACIÓN EN MODALES ---
    const btnCancelEdit = document.getElementById("btnCancelEdit");
    if (btnCancelEdit) {
        btnCancelEdit.onclick = (e) => { e.preventDefault(); Modals.cerrarEdicion(); };
    }

    const btnCancelDelete = document.getElementById("btnCancelDelete");
    if (btnCancelDelete) {
        btnCancelDelete.onclick = (e) => { e.preventDefault(); Modals.cerrarConfirmar(); };
    }
}