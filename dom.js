// ===============================
// dom.js
// Centraliza referencias al DOM
// ===============================

export const DOM = {
  // Consultar asignaciones
  consultarBtn: document.getElementById("consultarBtn"),
  territorioInput: document.getElementById("territorioInput"),
  resultadoDiv: document.getElementById("resultadoTerritorio"),

  // Formulario
  form: document.getElementById("asignacionForm"),
  mensaje: document.getElementById("mensaje"),

  inputs: {
    numeroTerritorio: document.getElementById("numero_territorio"),
    conductor: document.getElementById("conductor"),
    fechaAsignado: document.getElementById("fecha_asignado"),
    fechaCompletado: document.getElementById("fecha_completado"),
    totalAbarcado: document.getElementById("total_abarcado"),
  },

  // ====== Sugerencias ======
  btnBuscarSugerencias: document.getElementById("btnBuscarSugerencias"),
  rangoSelect: document.getElementById("rangoSelect"),
  resultadoSugerencias: document.getElementById("resultadoSugerencias"),
};

export const SECCIONES = {
  dashboard: document.getElementById("seccionDashboard"),
  agregar: document.getElementById("seccionAgregar"),
  consultar: document.getElementById("seccionConsultar"),
  sugerencias: document.getElementById("seccionSugerencias"),
};
