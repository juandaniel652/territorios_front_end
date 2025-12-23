// ===============================
// script.js (Dashboard con login)
// ===============================

import { UI, renderSugerencias, renderGraficoSugerencias } from "./ui.js";
import { Api } from "./api.js";
import { DOM } from "./dom.js";
import { Validators } from "./validators.js";

console.log("SCRIPT CARGADO - DASHBOARD");

// ===============================
// Autenticación
// ===============================

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "../login/index.html";
}

// ===============================
// Logout
// ===============================

function setupLogout() {
  const container = document.getElementById("logoutContainer");
  const btnLogoutMobile = document.getElementById("btnLogoutMobile");

  const btnLogout = document.createElement("button");
  btnLogout.textContent = "Salir";
  btnLogout.className =
    "h-10 flex items-center justify-center bg-red-600 text-white px-4 rounded-lg hover:bg-red-700";

  container.appendChild(btnLogout);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "../login/index.html";
  };

  btnLogout.addEventListener("click", logout);
  btnLogoutMobile?.addEventListener("click", logout);
}

setupLogout();

// ===============================
// Navegación
// ===============================

document.getElementById("btnDashboard")
  .addEventListener("click", () => DOM.mostrarSeccion("seccionDashboard"));

document.getElementById("btnAgregar")
  .addEventListener("click", () => DOM.mostrarSeccion("seccionAgregar"));

document.getElementById("btnConsultar")
  .addEventListener("click", () => DOM.mostrarSeccion("seccionConsultar"));

document.getElementById("btnSugerencias")
  .addEventListener("click", () => DOM.mostrarSeccion("seccionSugerencias"));

// ===============================
// Sidebar mobile
// ===============================

const sidebar = document.getElementById("sidebar");
const btnMobileMenu = document.getElementById("btnMobileMenu");

btnMobileMenu?.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full");
});

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

// ===============================
// Controllers
// ===============================

async function consultarAsignaciones(numero) {
  UI.limpiarResultados();

  if (!Validators.territorioValido(numero)) {
    UI.mostrarErrorResultados("Ingrese un número válido");
    return;
  }

  try {
    const data = await Api.getTerritorio(numero, token);
    UI.renderAsignaciones(numero, data.asignaciones || []);
  } catch {
    UI.mostrarErrorResultados("Error al consultar backend");
  }
}

async function enviarAsignacion(asignacion) {
  if (!Validators.asignacionCompleta(asignacion)) {
    UI.mostrarMensaje("Completá todos los campos", "error");
    return;
  }

  try {
    const res = await Api.crearAsignacion(asignacion, token);
    UI.mostrarMensaje(res.message || "Asignación guardada", "success");
    DOM.form.reset();
  } catch {
    UI.mostrarMensaje("Error al guardar", "error");
  }
}
