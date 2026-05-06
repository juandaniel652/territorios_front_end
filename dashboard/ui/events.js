// frontend/dashboard/ui/events.js
import { Modals } from "./modals.js";
import { UIManager } from "./ui.js";
import { Controller } from "../controller/dashboard.controller.js";

export function initGlobalEvents() {
    console.log("🚀 Orquestador de eventos inicializado");

    document.addEventListener("click", async (e) => {
        const target = e.target;

        // --- 1. LOGOUT ---
        if (target.closest("#btnLogout")) {
            localStorage.removeItem("token");
            window.location.href = "../login/index.html";
            return;
        }

        // --- 2. NAVEGACIÓN CANÓNICA ---
        const btnNav = target.closest(".nav-btn");
        if (btnNav) {
            const sectionId = btnNav.id.replace('btn', 'seccion');
            
            // Usamos el UIManager para la parte visual
            UIManager.cambiarSeccion(btnNav.id); 

            // Lógica específica según la sección
            if (btnNav.id === "btnAgenda") {
                UIManager.showLoading(true);
                try {
                    await Controller.cargarDashboardCompleto("1-20");
                } catch (err) {
                    console.error("Error al cargar agenda:", err);
                } finally {
                    UIManager.showLoading(false);
                }
            }
            return;
        }

        // --- 3. ACCIONES DE AGENDA (GENERAR) ---
        if (target.closest("#btnGenerarPropuesta")) {
            const fecha = document.getElementById("fechaInicioAgenda")?.value;
            if (!fecha) return alert("Seleccioná una fecha de inicio");

            UIManager.showLoading(true);
            try {
                // El controller hace el fetch y el UIManager renderiza el resultado
                await Controller.prepararAgendaQuincenal(fecha);
            } catch (err) {
                alert("Error al generar propuesta");
            } finally {
                UIManager.showLoading(false);
            }
            return;
        }

        // --- 4. ACCIONES DE AGENDA (CONFIRMAR) ---
        if (target.closest("#btnConfirmarAgenda")) {
            UIManager.showLoading(true);
            try {
                // Suponiendo que guardas la propuesta actual en window o el controller la gestiona
                await Controller.confirmarAgendaDefinitiva();
                alert("✅ Agenda guardada correctamente");
            } catch (err) {
                console.error(err);
            } finally {
                UIManager.showLoading(false);
            }
            return;
        }

        // --- 5. BUSCADOR DE SUGERENCIAS ---
        if (target.closest("#btnBuscarSugerencias")) {
            const select = document.getElementById("rangoSelect");
            const rango = select?.value; // Captura "1-20", "21-40", etc.

            if (!rango) return;
        
            UIManager.showLoading(true);
            try {
                // El Controller recibirá el string (ej: "21-40") 
                // y él se encargará de filtrar y pedir el rango al API
                await Controller.obtenerSugerencias(rango);
            } catch (err) {
                console.error("Error al buscar sugerencias:", err);
            } finally {
                UIManager.showLoading(false);
            }
            return;
        }

        // --- 6. CONSULTAR TERRITORIO ---
        if (target.closest("#consultarBtn")) {
            const num = document.getElementById("territorioInput")?.value;
            if (!num) return;
            UIManager.showLoading(true);
            try {
                await Controller.consultarTerritorio(num);
            } finally {
                UIManager.showLoading(false);
            }
            return;
        }

        // --- 7. GESTIÓN DE MODALES ---
        const btnEdit = target.closest(".btn-row-edit");
        if (btnEdit) {
            Modals.abrirEdicion(btnEdit.dataset);
            return;
        }

        if (target.closest("#btnCancelEdit, #btnCancelDelete, .modal-overlay")) {
            Modals.cerrarEdicion();
            Modals.cerrarConfirmar();
            return;
        }
    });

    // Evento extra para el formulario de "Agregar Asignación"
    const formAgregar = document.getElementById("asignacionForm");
    if (formAgregar) {
        formAgregar.onsubmit = async (e) => {
            e.preventDefault();
            UIManager.showLoading(true);
            try {
                // Recolectar datos y enviar al controller
                const formData = {
                    territorio: document.getElementById("numeroTerritorio").value,
                    conductor: document.getElementById("conductor").value,
                    // ... etc
                };
                await Controller.crearAsignacion(formData);
                formAgregar.reset();
            } finally {
                UIManager.showLoading(false);
            }
        };
    }
}