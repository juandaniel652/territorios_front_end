import { Modals } from "./modals.js";
import { UIManager } from "./ui.js";
import { Controller } from "../controller/dashboard.controller.js";

// ==========================================
// MANEJADORES DE EVENTOS INDEPENDIENTES
// ==========================================

function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "../login/index.html";
}

async function handleNavegacion(btnNav) {
    UIManager.cambiarSeccion(btnNav.id); 

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
}

async function handleGenerarPropuesta() {
    const fecha = document.getElementById("fechaInicioAgenda")?.value;
    if (!fecha) return alert("Seleccioná una fecha de inicio");

    UIManager.showLoading(true);
    try {
        await Controller.generarPropuesta(fecha);
    } catch (err) {
        alert("Error al generar propuesta");
    } finally {
        UIManager.showLoading(false);
    }
}

async function handleConfirmarAgenda() {
    try {
        await Controller.confirmarAgenda();
    } catch (err) {
        console.error("Error en la confirmación:", err);
    }
}

async function handleBuscarSugerencias() {
    const select = document.getElementById("rangoSelect");
    const rango = select?.value;
    if (!rango) return;

    UIManager.showLoading(true);
    try {
        await Controller.obtenerSugerencias(rango);
    } catch (err) {
        console.error("Error al buscar sugerencias:", err);
    } finally {
        UIManager.showLoading(false);
    }
}

async function handleConsultarTerritorio() {
    const num = document.getElementById("territorioInput")?.value;
    if (!num) return;
    UIManager.showLoading(true);
    try {
        await Controller.consultarTerritorio(num);
    } finally {
        UIManager.showLoading(false);
    }
}

function handleModals(target) {
    const btnEdit = target.closest(".btn-row-edit");
    if (btnEdit) {
        Modals.abrirEdicion(btnEdit.dataset);
        return true;
    }

    if (target.closest("#btnCancelEdit, #btnCancelDelete, .modal-overlay")) {
        Modals.cerrarEdicion();
        Modals.cerrarConfirmar();
        return true;
    }
    return false;
}

// Handler separado para el submit del formulario de asignación
async function handleAsignacionSubmit(e) {
    e.preventDefault();
    
    const conductorNombre = document.getElementById("conductor").value.trim();
    const fechaAsig = document.getElementById("fechaAsignado").value;

    if (!conductorNombre) {
        alert("El nombre del conductor es obligatorio.");
        return;
    }

    const formData = {
        numero_territorio: parseInt(document.getElementById("numeroTerritorio").value),
        conductor: conductorNombre,
        fecha_asignado: fechaAsig,
        fecha_completado: document.getElementById("fechaCompletado").value || null,
        cantidad_abarcado: document.getElementById("totalAbarcado").value || "Completo"
    };

    console.log("📤 Enviando a FastAPI desde handler aislado:", formData);

    UIManager.showLoading(true);
    try {
        // Le pasamos el callback () => e.target.reset() como 'onSuccess'
        await Controller.crearAsignacion(formData, () => {
            e.target.reset();
            console.log("🧹 Formulario reseteado tras confirmación exitosa.");
        });
    } catch (err) {
        console.error("❌ Error en la cadena de ejecución del submit:", err);
    } finally {
        UIManager.showLoading(false);
    }
}

// ==========================================
// ORQUESTADOR PRINCIPAL
// ==========================================

export function initGlobalEvents() {
    console.log("🚀 Orquestador de eventos inicializado (Modular)");

    // Listener único de Clics
    document.addEventListener("click", async (e) => {
        const target = e.target;

        if (target.closest("#btnLogout")) return handleLogout();
        
        const btnNav = target.closest(".nav-btn");
        if (btnNav) return await handleNavegacion(btnNav);

        if (target.closest("#btnGenerarPropuesta")) return await handleGenerarPropuesta();

        if (target.closest("#btnConfirmarAgenda")) return await handleConfirmarAgenda();

        if (target.closest("#btnBuscarSugerencias")) return await handleBuscarSugerencias();

        if (target.closest("#consultarBtn")) return await handleConsultarTerritorio();

        // Si maneja modales, corta la ejecución
        if (handleModals(target)) return;
    });

    // Lógica dinámica de fechas
    document.addEventListener("change", (e) => {
        if (e.target.id === "fechaAsignado") {
            UIManager.actualizarDiasSemanaLaboral(e.target.value);
        }
    });

    // Evento de Formulario con su handler asignado de forma limpia
    const formAgregar = document.getElementById("asignacionForm");
    if (formAgregar) {
        formAgregar.onsubmit = handleAsignacionSubmit;
    }
}