// ===============================
// script.js (Dashboard con login)
// ===============================

import { UI, renderSugerencias, renderGraficoSugerencias } from "../dashboard/ui.js";
import { Api } from "../dashboard/api.js";
import { DOM } from "../dashboard/dom.js";
import { Validators } from "../dashboard/validators.js";

console.log("SCRIPT CARGADO - VERSION FINAL");

// ===============================
// Login / Autenticación
// ===============================

// Verificar token al cargar
const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "../login/index.html";
}

// Función de logout
function setupLogout() {
    const container = document.getElementById("logoutContainer");

    const btnLogout = document.createElement("button");
    btnLogout.id = "btnLogout";
    btnLogout.textContent = "Salir";
    btnLogout.className =
        "h-10 flex items-center justify-center bg-red-600 text-white px-4 rounded-lg hover:bg-red-700";

    container.appendChild(btnLogout);

    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "../login/index.html";
    });
}

// Inicializar logout
setupLogout();

// ===============================
// Helpers (fechas, domingos, semana completado)
// ===============================

function generarUltimosDomingos(cantidad = 10) {
    const hoy = new Date();
    const domingos = [];
    const dia = hoy.getDay();
    const ultimoDomingo = new Date(hoy);
    ultimoDomingo.setDate(hoy.getDate() - dia);

    for (let i = 0; i < cantidad; i++) {
        const fecha = new Date(ultimoDomingo);
        fecha.setDate(ultimoDomingo.getDate() - i * 7);
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, "0");
        const dd = String(fecha.getDate()).padStart(2, "0");
        domingos.push(`${yyyy}-${mm}-${dd}`);
    }

    return domingos;
}

function obtenerSemanaCompletado(domingoISO) {
    const [yyyy, mm, dd] = domingoISO.split("-");
    const domingo = new Date(yyyy, mm - 1, dd);
    const dias = [];
    for (let i = 1; i <= 6; i++) { // lunes a sábado
        const dia = new Date(domingo);
        dia.setDate(domingo.getDate() + i);
        const yyyy = dia.getFullYear();
        const mm = String(dia.getMonth() + 1).padStart(2, "0");
        const dd = String(dia.getDate()).padStart(2, "0");
        dias.push(`${yyyy}-${mm}-${dd}`);
    }
    return dias;
}

// ===============================
// Fecha asignado y completado
// ===============================

const fechaAsignadoSelect = DOM.inputs.fechaAsignado;
const fechaCompletadoSelect = DOM.inputs.fechaCompletado;

function llenarDomingos() {
    const domingos = generarUltimosDomingos(10);
    fechaAsignadoSelect.innerHTML = "";
    domingos.forEach(d => {
        const option = document.createElement("option");
        option.value = d;
        option.textContent = d;
        fechaAsignadoSelect.appendChild(option);
    });

    fechaAsignadoSelect.value = domingos[0];
    actualizarSemanaCompletado(domingos[0]);
}

function actualizarSemanaCompletado(domingoISO) {
    const dias = obtenerSemanaCompletado(domingoISO);
    fechaCompletadoSelect.innerHTML = "";
    dias.forEach(d => {
        const option = document.createElement("option");
        option.value = d;
        option.textContent = d;
        fechaCompletadoSelect.appendChild(option);
    });
    fechaCompletadoSelect.value = dias[0];
}

fechaAsignadoSelect.addEventListener("change", () => {
    actualizarSemanaCompletado(fechaAsignadoSelect.value);
});

llenarDomingos();

// ===============================
// Controllers (Asignaciones, sugerencias)
// ===============================

async function consultarAsignaciones(numero) {
    UI.limpiarResultados();
    if (!Validators.territorioValido(numero)) {
        UI.mostrarErrorResultados("Ingrese un número de territorio válido.");
        return;
    }
    try {
        const data = await Api.getTerritorio(numero, token); // token incluido
        UI.renderAsignaciones(numero, data.asignaciones || []);
    } catch (err) {
        console.error(err);
        UI.mostrarErrorResultados("Error al consultar el backend.");
    }
}

async function enviarAsignacion(asignacion) {
    if (!Validators.asignacionCompleta(asignacion)) {
        UI.mostrarMensaje("Completá todos los campos.", "error");
        return;
    }
    try {
        const res = await Api.crearAsignacion(asignacion, token); // token incluido
        UI.mostrarMensaje(res.message || "Asignación guardada", "success");
        DOM.form.reset();
        llenarDomingos();
    } catch (err) {
        console.error(err);
        UI.mostrarMensaje(err.detail || "Error al guardar asignación", "error");
    }
}

// ===============================
// Eventos
// ===============================

DOM.consultarBtn.addEventListener("click", () => {
    consultarAsignaciones(DOM.territorioInput.value.trim());
});

DOM.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const asignacion = {
        numero_territorio: Number(DOM.inputs.numeroTerritorio.value),
        conductor: DOM.inputs.conductor.value.trim(),
        fecha_asignado: DOM.inputs.fechaAsignado.value,
        fecha_completado: DOM.inputs.fechaCompletado.value,
        total_abarcado: DOM.inputs.totalAbarcado.value.trim(),
    };
    enviarAsignacion(asignacion);
});

DOM.btnBuscarSugerencias.addEventListener("click", async () => {
    try {
        const rango = DOM.rangoSelect.value;
        const data = await Api.getSugerencias(rango, token); // token incluido
        renderSugerencias(data.sugerencias);
        renderGraficoSugerencias(data.sugerencias);
    } catch (err) {
        console.error(err);
        UI.mostrarErrorResultados("Error al obtener sugerencias");
    }
});

// ===============================
// Sidebar
// ===============================

document.getElementById("btnDashboard").addEventListener("click", () => DOM.mostrarSeccion("seccionDashboard"));
document.getElementById("btnAgregar").addEventListener("click", () => DOM.mostrarSeccion("seccionAgregar"));
document.getElementById("btnConsultar").addEventListener("click", () => DOM.mostrarSeccion("seccionConsultar"));
document.getElementById("btnSugerencias").addEventListener("click", () => DOM.mostrarSeccion("seccionSugerencias"));


// ===============================
// Sidebar Toggle (Mobile)
// ===============================

const sidebar = document.getElementById("sidebar");
const btnToggleMenu = document.getElementById("btnToggleMenu");
const overlay = document.getElementById("overlay");

// Abrir / cerrar sidebar
function toggleSidebar() {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("active");
}

// Cerrar sidebar
function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
}

// Botón hamburguesa
btnToggleMenu?.addEventListener("click", toggleSidebar);

// Click fuera (overlay)
overlay?.addEventListener("click", closeSidebar);

// ===============================
// Cerrar sidebar al navegar (mobile)
// ===============================

[
    "btnDashboard",
    "btnAgregar",
    "btnConsultar",
    "btnSugerencias",
].forEach(id => {
    const btn = document.getElementById(id);
    btn?.addEventListener("click", () => {
        closeSidebar();
    });
});
