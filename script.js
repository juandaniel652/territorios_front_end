// ===============================
// script.js
// ===============================

import { UI, renderSugerencias, renderGraficoSugerencias } from "./ui.js";
import { Api } from "./api.js";
import { DOM } from "./dom.js";
import { Validators } from "./validators.js";

console.log("SCRIPT CARGADO - VERSION FINAL");

// ===============================
// Helpers
// ===============================

// Genera los últimos domingos, siempre fecha local
function generarUltimosDomingos(cantidad = 10) {
  const hoy = new Date();
  const domingos = [];

  // Encontrar último domingo
  const dia = hoy.getDay(); // 0=domingo
  const ultimoDomingo = new Date(hoy);
  ultimoDomingo.setDate(hoy.getDate() - dia);

  for (let i = 0; i < cantidad; i++) {
    const fecha = new Date(ultimoDomingo);
    fecha.setDate(ultimoDomingo.getDate() - i * 7);
    // Construir YYYY-MM-DD en local
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    domingos.push(`${yyyy}-${mm}-${dd}`);
  }

  return domingos;
}

// Obtiene los días posteriores al domingo: lunes a sábado
function obtenerSemanaCompletado(domingoISO) {
  const partes = domingoISO.split("-");
  const domingo = new Date(partes[0], partes[1] - 1, partes[2]);
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

// Llenar últimos domingos en select
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

// Llenar fecha_completado según domingo elegido
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

// Evento cambio de domingo
fechaAsignadoSelect.addEventListener("change", () => {
  actualizarSemanaCompletado(fechaAsignadoSelect.value);
});

// Inicializar
llenarDomingos();

// ===============================
// Controllers
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
    const res = await Api.crearAsignacion(asignacion);
    UI.mostrarMensaje(res.message || "Asignación guardada", "success");
    DOM.form.reset();

    // Reset de fechas al enviar
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
    const data = await Api.getSugerencias(rango);
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
