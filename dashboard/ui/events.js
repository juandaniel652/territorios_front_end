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
        // Al dataset le pasamos la info de la fila directamente
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

// Handler para agregar una nueva asignación
async function handleAsignacionSubmit(e) {
    e.preventDefault();
    
    const conductorNombre = document.getElementById("conductor").value.trim();
    const fechaAsig = document.getElementById("fechaAsignado").value;
    const fechaCompRaw = document.getElementById("fechaCompletado").value;
    const totalAbarcadoRaw = document.getElementById("totalAbarcado").value;

    if (!conductorNombre) {
        alert("El nombre del conductor es obligatorio.");
        return;
    }

    if (!fechaAsig) {
        alert("La fecha de asignación es obligatoria.");
        return;
    }

    const fechaCompletado = (fechaCompRaw && fechaCompRaw.trim() !== "") ? fechaCompRaw : null;
    const cantidadAbarcado = (totalAbarcadoRaw && totalAbarcadoRaw.trim() !== "") ? totalAbarcadoRaw.trim() : "Completo";

    const formData = {
        numero_territorio: parseInt(document.getElementById("numeroTerritorio").value, 10),
        conductor: conductorNombre,
        fecha_asignado: fechaAsig,
        fecha_completado: fechaCompletado,
        cantidad_abarcado: cantidadAbarcado
    };

    console.log("📤 Guardando nueva asignación:", formData);

    UIManager.showLoading(true);
    try {
        await Controller.crearAsignacion(formData, () => {
            e.target.reset();
            console.log("🧹 Formulario de creación reseteado.");
        });
    } catch (err) {
        console.error("❌ Error al crear asignación:", err);
    } finally {
        UIManager.showLoading(false);
    }
}

// 💡 NUEVO: Handler para procesar los cambios editados del modal
async function handleAsignacionEditSubmit(e) {
    e.preventDefault(); // ⚠️ EVITA QUE LA VENTANA SE RECARGUE E IMPIDE EL CIERRE AUTOMÁTICO
    
    const id = document.getElementById("editId").value;
    const conductorNombre = document.getElementById("editConductor").value.trim();
    const fechaAsig = document.getElementById("editFechaAsignado").value;
    const fechaCompRaw = document.getElementById("editFechaCompletado").value;
    const totalAbarcadoRaw = document.getElementById("editCantidad").value; 
    const numeroTerritorio = document.getElementById("editTerritorio")?.value || "0";

    if (!conductorNombre) {
        alert("El nombre del conductor es obligatorio.");
        return;
    }

    if (!fechaAsig) {
        alert("La fecha de asignación es obligatoria.");
        return;
    }

    const fechaCompletado = (fechaCompRaw && fechaCompRaw.trim() !== "") ? fechaCompRaw : null;
    const cantidadAbarcado = (totalAbarcadoRaw && totalAbarcadoRaw.trim() !== "") ? totalAbarcadoRaw.trim() : "Completo";

    const datosActualizados = {
        numero_territorio: parseInt(numeroTerritorio, 10),
        conductor: conductorNombre,
        fecha_asignado: fechaAsig,
        fecha_completado: fechaCompletado,
        cantidad_abarcado: cantidadAbarcado
    };

    console.log(`💾 Enviando actualización para la asignación [ID: ${id}]:`, datosActualizados);

    UIManager.showLoading(true);
    try {
        await Controller.editarAsignacion(id, datosActualizados, () => {
            Modals.cerrarEdicion(); // Solo se cierra si la API responde con éxito 200
            console.log("✅ Asignación modificada con éxito.");
        });
    } catch (err) {
        console.error("❌ Error en la cadena de actualización:", err);
    } finally {
        UIManager.showLoading(false);
    }
}

// ==========================================
// ORQUESTADOR PRINCIPAL
// ==========================================

export function initGlobalEvents() {
    console.log("🚀 Orquestador de eventos inicializado (Modular)");

    document.addEventListener("click", async (e) => {
        const target = e.target;

        if (target.closest("#btnLogout")) return handleLogout();

        // 1. 💡 Primero procesamos los modales. Si el clic fue en un botón de edición o cerrar, 
        // handleModals devolverá true y cortará la ejecución inmediatamente.
        if (handleModals(target)) return;

        // 2. Ahora evaluamos si es un botón de navegación del menú
        const btnNav = target.closest(".nav-btn");
        if (btnNav) {
            // Evitamos falsos positivos: si el botón es de edición, no navegamos
            if (btnNav.classList.contains('btn-row-edit') || btnNav.id?.includes('Edit')) {
                return;
            }
            return await handleNavegacion(btnNav);
        }

        // 3. Resto de eventos comunes
        if (target.closest("#btnGenerarPropuesta")) return await handleGenerarPropuesta();
        if (target.closest("#btnConfirmarAgenda")) return await handleConfirmarAgenda();
        if (target.closest("#btnBuscarSugerencias")) return await handleBuscarSugerencias();
        if (target.closest("#consultarBtn")) return await handleConsultarTerritorio();
    });

    // Lógica dinámica de fechas
    document.addEventListener("change", (e) => {
        if (e.target.id === "fechaAsignado") {
            UIManager.actualizarDiasSemanaLaboral(e.target.value);
        }
    });

    // Evento de Formulario de Creación
    const formAgregar = document.getElementById("asignacionForm");
    if (formAgregar) {
        formAgregar.onsubmit = handleAsignacionSubmit;
    }

    // 💡 NUEVO: Vinculamos el formulario del modal de edición
    const formEditar = document.getElementById("editAsignacionForm");
    if (formEditar) {
        formEditar.onsubmit = handleAsignacionEditSubmit;
    } else {
        // En caso de que tu formulario en el HTML no use ID sino una clase,
        // o use directamente el ID del modal para su tag <form>
        const formEditarAlternativo = document.querySelector("#modalEdicion form");
        if (formEditarAlternativo) {
            formEditarAlternativo.onsubmit = handleAsignacionEditSubmit;
        }
    }
}