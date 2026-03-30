// script.js — Entry point
import { UI }          from "./ui/ui.js";
import { DOM }         from "./ui/dom.js";
import { AuthService } from "./infrastructure/auth/AuthService.js";
import { consultarAsignaciones, crearAsignacion, cargarSugerencias }
                       from "./application/usecases/controller.js";

if (!AuthService.isAuthenticated()) window.location.href = "../login/index.html";

document.getElementById("btnLogout").addEventListener("click", () => AuthService.logout());

// ── Fechas ────────────────────────────────────────────────────
const diasES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function generarUltimosDomingos(cantidad = 10) {
    const hoy = new Date();
    const ultimo = new Date(hoy);
    ultimo.setDate(hoy.getDate() - hoy.getDay());
    return Array.from({ length: cantidad }, (_, i) => {
        const f = new Date(ultimo);
        f.setDate(ultimo.getDate() - i * 7);
        const yyyy = f.getFullYear();
        const mm   = String(f.getMonth() + 1).padStart(2, "0");
        const dd   = String(f.getDate()).padStart(2, "0");
        return { iso: `${yyyy}-${mm}-${dd}`, dia: diasES[f.getDay()] };
    });
}

function obtenerSemanaCompletado(domingoISO) {
    const [y, m, d] = domingoISO.split("-");
    const domingo = new Date(y, m - 1, d);
    return Array.from({ length: 6 }, (_, i) => {
        const f = new Date(domingo);
        f.setDate(domingo.getDate() + i + 1);
        const yy = f.getFullYear();
        const mm = String(f.getMonth() + 1).padStart(2, "0");
        const dd = String(f.getDate()).padStart(2, "0");
        return { iso: `${yy}-${mm}-${dd}`, dia: diasES[f.getDay()] };
    });
}

function llenarDomingos() {
    const domingos = generarUltimosDomingos(10);
    DOM.inputs.fechaAsignado.innerHTML = domingos
        .map(d => `<option value="${d.iso}">${d.dia} (${d.iso})</option>`).join("");
    DOM.inputs.fechaAsignado.value = domingos[0].iso;
    actualizarSemanaCompletado(domingos[0].iso);
}

function actualizarSemanaCompletado(domingoISO) {
    const dias = obtenerSemanaCompletado(domingoISO);
    DOM.inputs.fechaCompletado.innerHTML = dias
        .map(d => `<option value="${d.iso}">${d.dia} (${d.iso})</option>`).join("");
    DOM.inputs.fechaCompletado.value = dias[0].iso;
}

DOM.inputs.fechaAsignado.addEventListener("change", () =>
    actualizarSemanaCompletado(DOM.inputs.fechaAsignado.value));

llenarDomingos();

// ── Eventos ───────────────────────────────────────────────────
DOM.consultarBtn.addEventListener("click", () =>
    consultarAsignaciones(DOM.territorioInput.value.trim(), UI));

DOM.form.addEventListener("submit", e => {
    e.preventDefault();
    crearAsignacion({
        numero_territorio: Number(DOM.inputs.numeroTerritorio.value),
        conductor:         DOM.inputs.conductor.value.trim(),
        fecha_asignado:    DOM.inputs.fechaAsignado.value,
        fecha_completado:  DOM.inputs.fechaCompletado.value,
        total_abarcado:    DOM.inputs.totalAbarcado.value.trim(),
    }, UI, () => llenarDomingos());
});

DOM.btnBuscarSugerencias.addEventListener("click", () =>
    cargarSugerencias(DOM.rangoSelect.value, UI));

// ── Sidebar ───────────────────────────────────────────────────
document.getElementById("btnDashboard").addEventListener("click",   () => DOM.mostrarSeccion("seccionDashboard"));
document.getElementById("btnAgregar").addEventListener("click",     () => DOM.mostrarSeccion("seccionAgregar"));
document.getElementById("btnConsultar").addEventListener("click",   () => DOM.mostrarSeccion("seccionConsultar"));
document.getElementById("btnSugerencias").addEventListener("click", () => DOM.mostrarSeccion("seccionSugerencias"));
