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
    const esAgenda = modalTitle.includes("Planificación") || modalTitle.includes("Territorio");

    const payload = {
        conductor: document.getElementById("editConductor").value.trim(),
        fecha: document.getElementById("editFechaAsignado").value,
        fecha_completado_estipulada: document.getElementById("editFechaCompletado").value, // Nombre semántico
        punto_encuentro: document.getElementById("editCantidad").value.trim()
    };

    if (esAgenda) {
        try {
            const res = await fetch(`https://backend-territorios.onrender.com/api/v1/salidas/${id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    conductor: payload.conductor,
                    fecha: payload.fecha,
                    punto_encuentro: payload.punto_encuentro
                    // Nota: Aquí pasas los campos exactos que tu tabla 'salidas' acepta
                })
            });

            if (res.ok) {
                UI.mostrarMensaje("Planificación actualizada", "success");
                UI.cerrarModalEdicion();
                UI.cargarYMostrarAgenda();
            }
        } catch (error) {
            UI.mostrarMensaje("Error de red", "error");
        }
    } else {
        const asignacionData = {
            id: id,
            conductor: document.getElementById("editConductor").value.trim(),
            fecha_asignado: document.getElementById("editFechaAsignado").value,
            fecha_completado: document.getElementById("editFechaCompletado").value,
            cantidad_abarcado: document.getElementById("editCantidad").value.trim()
        };
        
        // Llamamos a tu función importada del controller
        await editarAsignacion(id, asignacionData, UI, () => {
            UI.mostrarMensaje("Registro histórico actualizado", "success");
            UI.cerrarModalEdicion();
            refrescarTabla(); // Esto recarga la tabla de consulta donde estabas
        });
    }
});

// Botones de cancelar con "?"
document.getElementById("btnCancelEdit")?.addEventListener("click", () => {
    // 1. Cerramos el modal usando tu objeto UI
    UI.cerrarModalEdicion();

    // 2. RESETEAMOS los textos a su estado original para que "Asignaciones" no se vea afectado
    const labelFechaA = document.querySelector('label[for="editFechaAsignado"]');
    const labelFechaC = document.querySelector('label[for="editFechaCompletado"]');
    const labelCant   = document.querySelector('label[for="editCantidad"]');
    const inputCant   = document.getElementById("editCantidad");

    if (labelFechaA) labelFechaA.innerText = "Fecha Asignado";
    if (labelFechaC) labelFechaC.innerText = "Fecha Completado";
    if (labelCant)   labelCant.innerText   = "Cantidad Abarcada";
    if (inputCant)   inputCant.placeholder = "Ej: 100% o descripción";
    
    // También reseteamos el título del modal por si acaso
    const modalTitle = document.querySelector("#modalEdicion .modal-title");
    if (modalTitle) modalTitle.innerText = "Editar asignación";
});

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

    // --- TRANSFORMACIÓN VISUAL (Solo para Agenda) ---
    // Buscamos los labels dentro del modal para cambiarles el nombre
    const labelFechaA = document.querySelector('#modalEdicion label[for="editFechaAsignado"]');
    const labelFechaC = document.querySelector('#modalEdicion label[for="editFechaCompletado"]');
    const labelCant   = document.querySelector('#modalEdicion label[for="editCantidad"]');
    const inputCant   = document.getElementById("editCantidad");

    if (labelFechaA) labelFechaA.innerText = "Fecha de Salida";
    if (labelFechaC) labelFechaC.innerText = "Fecha Estipulada"; // Meta de fin
    if (labelCant)   labelCant.innerText   = "Punto de Encuentro / Horario";
    if (inputCant)   inputCant.placeholder = "Ej: Portón principal, 08:30hs";

    // --- CARGA DE DATOS ---
    document.getElementById("editId").value = salida.id;
    document.getElementById("editConductor").value = salida.conductor || "";
    document.getElementById("editFechaAsignado").value = salida.fecha || "";
    document.getElementById("editFechaCompletado").value = salida.fecha_completado || "";
    document.getElementById("editCantidad").value = salida.punto_encuentro || "";

    // Título Corporativo
    const modalTitle = document.querySelector("#modalEdicion .modal-title");
    modalTitle.innerHTML = `
        <span class="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Planificación de Salida</span><br>
        Territorio #${String(salida.territorio_id).padStart(2, '0')}
    `;
    
    document.getElementById("modalEdicion").classList.remove("hidden");
};

window.confirmarBaja = (id) => {
    const salida = window.agendaActual.find(a => a.id === id);
    if (!salida) return;

    document.getElementById("confirmDeleteId").value = salida.id;
    document.getElementById("confirmInfoText").innerText = `Vas a dar de baja la salida del territorio #${salida.territorio_id}`;
    document.getElementById("modalConfirm").classList.remove("hidden");
};

if (AuthService.isAuthenticated() && !AuthService.isAdmin()) {
    console.warn("⚠️ Modo Lectura: Restringiendo interfaz.");
    
    // 1. Inyectamos CSS para ocultar lo que no debe ver
    const style = document.createElement('style');
    style.innerHTML = `
        #btnAgregar, 
        .btn-row-edit, 
        .btn-row-delete,
        #seccionAgregar,
        /* Oculta la card de "Planificar Nueva Agenda" */
        #seccionAgenda .form-card:first-of-type,
        /* Oculta los botones de acción en las tablas si se filtran por clase */
        .admin-only { 
            display: none !important; 
        }
    `;
    document.head.appendChild(style);

    // 2. Eliminamos físicamente los botones de navegación prohibidos
    document.getElementById("btnAgregar")?.remove();
    
    // Opcional: Si no quieres que el usuario use las sugerencias para asignar:
    // document.getElementById("btnSugerencias")?.remove(); 
}

UI.initDatePickers();