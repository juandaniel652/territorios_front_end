// script.js — Entry point
import { UI, setOnAsignacionModificada } from "./ui/ui.js";
import { DOM }                         from "./ui/dom.js";
import { AuthService }                 from "./infrastructure/auth/AuthService.js";
import { 
    consultarAsignaciones, 
    crearAsignacion, 
    cargarSugerencias, 
    editarAsignacion, 
    eliminarAsignacion,
    prepararAgendaQuincenal, 
    confirmarAgendaDefinitiva  
} from "./application/usecases/controller.js";
import { DateFormatter } from "./ui/utils.js";

// --- Control de Acceso Visual ---
if (AuthService.isAuthenticated() && !AuthService.isAdmin()) {
    console.warn("⚠️ Acceso como Usuario: Restringiendo acciones de edición.");
    
    const style = document.createElement('style');
    style.innerHTML = `
        #btnAgregar, 
        .btn-row-edit, .btn-row-delete,
        #sectionAgregar { 
            display: none !important; 
        }
    `;
    document.head.appendChild(style);

    // Quitamos la eliminación de sugerencias para que el User las pueda usar
    document.getElementById("btnAgregar")?.remove();
    // document.getElementById("btnSugerencias")?.remove(); <-- COMENTÁ O BORRÁ ESTA LÍNEA
}

if (!AuthService.isAuthenticated()) window.location.href = "../login/index.html";
document.getElementById("btnLogout").addEventListener("click", () => AuthService.logout());

// ── Helpers de fechas ─────────────────────────────────────────────────────────
const diasES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function generarUltimosDomingos(cantidad = 10) {
    const hoy    = new Date();
    const ultimo = new Date(hoy);
    ultimo.setDate(hoy.getDate() - hoy.getDay());
    return Array.from({ length: cantidad }, (_, i) => {
        const f  = new Date(ultimo);
        f.setDate(ultimo.getDate() - i * 7);
        const yy = f.getFullYear();
        const mm = String(f.getMonth() + 1).padStart(2, "0");
        const dd = String(f.getDate()).padStart(2, "0");
        return { iso: `${yy}-${mm}-${dd}`, dia: diasES[f.getDay()] };
    });
}

function obtenerSemanaCompletado(domingoISO) {
    const [y, m, d] = domingoISO.split("-");
    const domingo   = new Date(y, m - 1, d);
    return Array.from({ length: 6 }, (_, i) => {
        const f  = new Date(domingo);
        f.setDate(domingo.getDate() + i + 1);
        const yy = f.getFullYear();
        const mm = String(f.getMonth() + 1).padStart(2, "0");
        const dd = String(f.getDate()).padStart(2, "0");
        return { iso: `${yy}-${mm}-${dd}`, dia: diasES[f.getDay()] };
    });
}

function llenarDomingos() {
    // Si el input no existe en el DOM, salimos de la función sin tirar error
    if (!DOM.inputs.fechaAsignado) return; 

    const domingos = generarUltimosDomingos(10);
    DOM.inputs.fechaAsignado.innerHTML = domingos
        .map(d => {
            const fechaAR = DateFormatter.toArgentina(d.iso);
            return `<option value="${d.iso}">${d.dia} (${fechaAR})</option>`;
        }).join("");
    DOM.inputs.fechaAsignado.value = domingos[0].iso;
    actualizarSemanaCompletado(domingos[0].iso);
}

function actualizarSemanaCompletado(domingoISO) {
    const dias = obtenerSemanaCompletado(domingoISO);
    DOM.inputs.fechaCompletado.innerHTML = dias
        .map(d => {
            const fechaAR = DateFormatter.toArgentina(d.iso); // <--- Formateo quirúrgico
            return `<option value="${d.iso}">${d.dia} (${fechaAR})</option>`;
        }).join("");
    DOM.inputs.fechaCompletado.value = dias[0].iso;
}

DOM.inputs.fechaAsignado.addEventListener("change", () =>
    actualizarSemanaCompletado(DOM.inputs.fechaAsignado.value));
llenarDomingos();

// ── Último territorio consultado (para refrescar tras editar/eliminar) ─────────
let ultimoTerritorioConsultado = null;

function refrescarTabla() {
    if (ultimoTerritorioConsultado) {
        consultarAsignaciones(ultimoTerritorioConsultado, UI);
    }
}

setOnAsignacionModificada(refrescarTabla);

// ── Consultar ─────────────────────────────────────────────────────────────────
DOM.consultarBtn.addEventListener("click", () => {
    ultimoTerritorioConsultado = DOM.territorioInput.value.trim();
    consultarAsignaciones(ultimoTerritorioConsultado, UI);
});

// ── Crear asignación ──────────────────────────────────────────────────────────
DOM.form.addEventListener("submit", e => {
    e.preventDefault();

    // Captura manual ultra-segura
    const numero = DOM.inputs.numeroTerritorio.value;
    const conductor = DOM.inputs.conductor.value.trim();
    const fAsignado = DOM.inputs.fechaAsignado.value;
    const fCompletado = DOM.inputs.fechaCompletado.value;
    const cantidad = DOM.inputs.totalAbarcado.value.trim();

    // Log para que veas en consola si falta algo
    console.log("Datos capturados:", { numero, conductor, fAsignado, fCompletado, cantidad });

    const asignacionData = {
        numero_territorio: Number(numero),
        conductor: conductor,
        fecha_asignado: fAsignado,
        fecha_completado: fCompletado,
        cantidad_abarcado: cantidad
    };

    // Llamamos al controller
    crearAsignacion(asignacionData, UI, () => {
        DOM.form.reset();
        llenarDomingos(); // Esto resetea los select a valores válidos
    });
});

// ── Sugerencias ───────────────────────────────────────────────────────────────
DOM.btnBuscarSugerencias.addEventListener("click", () =>
    cargarSugerencias(DOM.rangoSelect.value, UI));

// ── Modal edición: guardar ────────────────────────────────────────────────────
// ── Modal edición: guardar ────────────────────────────────────────────────────
// Usamos "?" para que si el formulario no existe (User), no tire error
document.getElementById("formEdicion")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const id = Number(document.getElementById("editId").value);
    const modalTitle = document.querySelector("#modalEdicion .modal-title").innerText;
    
    // DETECTAMOS: ¿Estamos editando una Salida de la Agenda o una Asignación histórica?
    const esAgenda = modalTitle.includes("Territorio #"); 

    const campos = {
        conductor: document.getElementById("editConductor").value.trim(),
        punto_encuentro: document.getElementById("editCantidad").value.trim(), // 'editCantidad' es el ID en tu HTML para el encuentro
    };

    if (esAgenda) {
        // --- CASO A: GUARDAR EN AGENDA (SALIDAS) ---
        try {
            const res = await fetch(`https://backend-territorios.onrender.com/api/v1/salidas/${id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(campos)
            });

            if (res.ok) {
                UI.mostrarMensaje("Planificación actualizada", "success");
                UI.cerrarModalEdicion();
                UI.cargarYMostrarAgenda(); // Refresca solo la tabla de la agenda
            } else {
                UI.mostrarMensaje("Error al actualizar agenda", "error");
            }
        } catch (error) {
            console.error(error);
        }

    } else {
        // --- CASO B: GUARDAR EN ASIGNACIONES (HISTORIAL) ---
        // Aquí se queda tu lógica vieja para la sección de "Consultar"
        const camposAsignacion = {
            id,
            conductor: campos.conductor,
            cantidad_abarcado: campos.punto_encuentro,
            // (puedes añadir fechas aquí si el modal de asignación las tiene)
        };
        
        await editarAsignacion(id, camposAsignacion, UI, () => {
            UI.cerrarModalEdicion();
            refrescarTabla(); // Refresca la tabla de consultas
        });
    }
});

// Botones de cancelar con "?"
document.getElementById("btnCancelEdit")?.addEventListener("click", () => UI.cerrarModalEdicion());

// ── Modal confirmación: eliminar ──────────────────────────────────────────────
// script.js

document.getElementById("btnConfirmDelete")?.addEventListener("click", async () => {
    const id = Number(document.getElementById("confirmDeleteId").value);
    if (!id) return;

    // Detectamos si el modal se abrió desde la Agenda por el texto del contexto
    const esAgenda = document.getElementById("confirmInfoText").innerText.includes("salida");

    if (esAgenda) {
        try {
            // Llamada directa al endpoint de salidas (Soft Delete)
            const res = await fetch(`https://backend-territorios.onrender.com/api/v1/salidas/${id}`, {
                method: 'DELETE', // O PATCH si usas "activo: false"
                headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
            });

            if (res.ok) {
                UI.mostrarMensaje("Salida dada de baja correctamente", "success");
                UI.cerrarModalConfirm();
                UI.cargarYMostrarAgenda(); // Refrescamos la tabla de agenda
            } else {
                const err = await res.json();
                UI.mostrarMensaje(err.detail || "Error al dar de baja", "error");
            }
        } catch (e) {
            UI.mostrarMensaje("Error de conexión", "error");
        }
    } else {
        // Si no es agenda, sigue con el comportamiento normal de asignaciones
        await eliminarAsignacion(id, UI, () => {
            UI.cerrarModalConfirm();
            refrescarTabla();
        });
    }
});

document.getElementById("btnCancelDelete")?.addEventListener("click", () => UI.cerrarModalConfirm());

// ── Sidebar con "?" ───────────────────────────────────────────────────────────
// ... (después de los otros botones del sidebar)

// ── Navegación Sidebar ──
document.getElementById("btnDashboard")?.addEventListener("click", () => DOM.mostrarSeccion("seccionDashboard"));
document.getElementById("btnAgregar")?.addEventListener("click", () => DOM.mostrarSeccion("seccionAgregar"));
document.getElementById("btnConsultar")?.addEventListener("click", () => DOM.mostrarSeccion("seccionConsultar"));
document.getElementById("btnSugerencias")?.addEventListener("click", () => DOM.mostrarSeccion("seccionSugerencias"));
document.getElementById("btnAgenda")?.addEventListener("click", () => DOM.mostrarSeccion("seccionAgenda")); // <-- AGREGAR ESTO

// ── Lógica de Agenda ──
document.getElementById("btnGenerarPropuesta")?.addEventListener("click", async () => {
    const fecha = document.getElementById("fechaInicioAgenda").value;
    if (!fecha) {
        UI.mostrarMensaje("Por favor, selecciona una fecha de inicio", "error");
        return;
    }
    
    // Llamada a la lógica (aseguráte que prepararAgendaQuincenal esté importada)
    await prepararAgendaQuincenal(fecha, {
        ...UI,
        renderVistaPreviaAgenda: (plan) => {
            Tables.renderVistaPreviaAgenda(plan, () => {
                // Callback de confirmación
                confirmarAgendaDefinitiva(plan, "Juan Daniel", UI, () => {
                    document.getElementById("containerPropuesta").innerHTML = `
                        <div style="padding: 40px; text-align: center; color: var(--green-600);" class="animate-in">
                            <p style="font-size: 40px;">✅</p>
                            <p style="font-weight: 600;">Agenda confirmada con éxito.</p>
                        </div>`;
                });
            });
        }
    });
});

document.getElementById("btnAgenda")?.addEventListener("click", () => {
    DOM.mostrarSeccion("seccionAgenda");
    UI.cargarYMostrarAgenda(); // <--- AGREGAR ESTO
});

window.agendaActual = [];

window.gestionarEdicion = (id) => {
    const salida = window.agendaActual.find(a => a.id === id);
    if (!salida) return;

    // Usamos el modal de edición existente pero con enfoque serio
    document.getElementById("editId").value = salida.id;
    document.getElementById("editConductor").value = salida.conductor || "";
    document.getElementById("editCantidad").value = salida.punto_encuentro || "";
    
    // Cambiamos fechas si el modal las pide (están en tu HTML)
    if(document.getElementById("editFechaAsignado")) {
        document.getElementById("editFechaAsignado").value = salida.fecha;
    }

    const modalTitle = document.querySelector("#modalEdicion .modal-title");
    modalTitle.innerHTML = `<span class="text-xs text-gray-400 uppercase tracking-widest">Orden de Cambio</span><br>Territorio #${salida.territorio_id}`;
    
    document.getElementById("modalEdicion").classList.remove("hidden");
};

window.confirmarBaja = (id) => {
    const salida = window.agendaActual.find(a => a.id === id);
    if (!salida) return;

    document.getElementById("confirmDeleteId").value = salida.id;
    document.getElementById("confirmInfoText").innerText = `Vas a dar de baja la salida del territorio #${salida.territorio_id}`;
    document.getElementById("modalConfirm").classList.remove("hidden");
};

UI.initDatePickers();