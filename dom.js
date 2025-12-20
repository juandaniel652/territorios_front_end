// ===============================
// dom.js (capa de acceso al DOM)
// ===============================
export const DOM = {
  form: document.getElementById("asignacionForm"),
  mensaje: document.getElementById("mensaje"),
  consultarBtn: document.getElementById("consultarBtn"),
  resultadoDiv: document.getElementById("resultadoTerritorio"),
  territorioInput: document.getElementById("territorioInput"),

  inputs: {
    numeroTerritorio: document.getElementById("numero_territorio"),
    conductor: document.getElementById("conductor"),
    fechaAsignado: document.getElementById("fecha_asignado"),
    fechaCompletado: document.getElementById("fecha_completado"),
    totalAbarcado: document.getElementById("total_abarcado")
  }
};