// script.js — Entry point
import { UI, setOnAsignacionModificada } from "./ui/ui.js";
import { DOM }                         from "./ui/dom.js";
import { AuthService }                 from "./infrastructure/auth/AuthService.js";
import { 
    consultarAsignaciones, 
    crearAsignacion, 
    cargarSugerencias, 
    editarAsignacion, 
    eliminarAsignacion 
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
    crearAsignacion({
        numero_territorio: Number(DOM.inputs.numeroTerritorio.value),
        conductor:         DOM.inputs.conductor.value.trim(),
        fecha_asignado:    DOM.inputs.fechaAsignado.value,
        fecha_completado:  DOM.inputs.fechaCompletado.value,
        cantidad_abarcado: DOM.inputs.totalAbarcado.value.trim(),
    }, UI, () => llenarDomingos());
});

// ── Sugerencias ───────────────────────────────────────────────────────────────
DOM.btnBuscarSugerencias.addEventListener("click", () =>
    cargarSugerencias(DOM.rangoSelect.value, UI));

// ── Modal edición: guardar ────────────────────────────────────────────────────
// ── Modal edición: guardar ────────────────────────────────────────────────────
// Usamos "?" para que si el formulario no existe (User), no tire error
document.getElementById("formEdicion")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idRaw = document.getElementById("editId").value;
    const id = Number(idRaw);
    
    if (!id || isNaN(id)) {
        UI.mostrarMensaje("ID de asignación inválido.", "error");
        return;
    }

    const campos = {
        id,
        conductor: document.getElementById("editConductor").value.trim() || undefined,
        fecha_asignado: document.getElementById("editFechaAsignado").value || undefined,
        fecha_completado: document.getElementById("editFechaCompletado").value || undefined,
        cantidad_abarcado: document.getElementById("editCantidad").value.trim() || undefined,
    };

    Object.keys(campos).forEach(k => campos[k] === undefined && delete campos[k]);

    await editarAsignacion(id, campos, UI, () => {
        UI.cerrarModalEdicion();
        refrescarTabla();
    });
});

// Botones de cancelar con "?"
document.getElementById("btnCancelEdit")?.addEventListener("click", () => UI.cerrarModalEdicion());

// ── Modal confirmación: eliminar ──────────────────────────────────────────────
document.getElementById("btnConfirmDelete")?.addEventListener("click", async () => {
    const idRaw = document.getElementById("confirmDeleteId").value;
    const id = Number(idRaw);
    if (!id || isNaN(id)) return;

    await eliminarAsignacion(id, UI, () => {
        UI.cerrarModalConfirm();
        refrescarTabla();
    });
});

document.getElementById("btnCancelDelete")?.addEventListener("click", () => UI.cerrarModalConfirm());

// ── Sidebar con "?" ───────────────────────────────────────────────────────────
// Esto asegura que la navegación no se rompa si falta algún botón
document.getElementById("btnDashboard")?.addEventListener("click", () => DOM.mostrarSeccion("seccionDashboard"));
document.getElementById("btnAgregar")?.addEventListener("click", () => DOM.mostrarSeccion("seccionAgregar"));
document.getElementById("btnConsultar")?.addEventListener("click", () => DOM.mostrarSeccion("seccionConsultar"));
document.getElementById("btnSugerencias")?.addEventListener("click", () => DOM.mostrarSeccion("seccionSugerencias"));

// TEST — borrar después
document.addEventListener("click", (e) => {
    console.log("Click en:", e.target, "| clases:", e.target.className);

});

UI.initDatePickers();