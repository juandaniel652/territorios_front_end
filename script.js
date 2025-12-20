// ===============================
// script.js
// Punto de entrada de la aplicación
// ===============================

// ----- Importaciones -----
import { UI, renderSugerencias, renderGraficoSugerencias, mostrarSeccion } from "./ui.js";
import { Api } from "./api.js";
import { DOM } from "./dom.js";
import { Validators } from "./validators.js";


// ===============================
console.log("SCRIPT CARGADO - VERSION MODULAR");

// ===============================
// Controllers (orquestación)
// ===============================

async function consultarAsignaciones(numero) {
  UI.limpiarResultados();

  if (!Validators.territorioValido(numero)) {
    UI.mostrarErrorResultados("Ingrese un número de territorio válido.");
    return;
  }

  try {
    const data = await Api.getTerritorio(numero);
    UI.renderAsignaciones(numero, data.asignaciones || []);
  } catch (error) {
    UI.mostrarErrorResultados("Error al consultar el backend.");
    console.error("Error consultarAsignaciones:", error);
  }
}

async function enviarAsignacion(asignacion) {
  if (!Validators.asignacionCompleta(asignacion)) {
    UI.mostrarMensaje("Por favor completa todos los campos", "error");
    return;
  }

  try {
    const result = await Api.crearAsignacion(asignacion);
    UI.mostrarMensaje(result.message, "success");
    DOM.form.reset();

    if (DOM.territorioInput.value.trim() === String(asignacion.numero_territorio)) {
      consultarAsignaciones(asignacion.numero_territorio);
    }
  } catch (error) {
    UI.mostrarMensaje(error.detail || "Error al agregar asignación", "error");
    console.error("Error enviarAsignacion:", error);
  }
}

async function consultarSugerencias() {
  const rango = DOM.rangoSelect.value;

  try {
    const data = await Api.getSugerencias(rango);
    renderSugerencias(data.sugerencias);
    renderGraficoSugerencias(data.sugerencias);
  } catch (error) {
    console.error("Error sugerencias:", error);
    UI.mostrarErrorResultados("Error al obtener sugerencias");
  }
}

// ===============================
// Eventos
// ===============================

DOM.consultarBtn.addEventListener("click", () => {
  consultarAsignaciones(DOM.territorioInput.value.trim());
});

DOM.form.addEventListener("submit", e => {
  e.preventDefault();

  const asignacion = {
    numero_territorio: parseInt(DOM.inputs.numeroTerritorio.value, 10),
    conductor: DOM.inputs.conductor.value.trim(),
    fecha_asignado: DOM.inputs.fechaAsignado.value,
    fecha_completado: DOM.inputs.fechaCompletado.value,
    total_abarcado: DOM.inputs.totalAbarcado.value.trim()
  };

  enviarAsignacion(asignacion);
});

DOM.btnBuscarSugerencias.addEventListener("click", consultarSugerencias);

document.getElementById("btnDashboard").addEventListener("click", () => {
  mostrarSeccion("dashboard");
});

document.getElementById("btnAgregar").addEventListener("click", () => {
  mostrarSeccion("agregar");
});

document.getElementById("btnConsultar").addEventListener("click", () => {
  mostrarSeccion("consultar");
});

document.getElementById("btnSugerencias").addEventListener("click", () => {
  mostrarSeccion("sugerencias");
});
