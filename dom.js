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

  // ====== Secciones ======
  mostrarSeccion: function(id) {
    document.querySelectorAll("main section").forEach(sec => {
      sec.classList.add("hidden");
      sec.classList.remove("animate-section-in");
    });

    const activa = document.getElementById(id);
    activa.classList.remove("hidden");
    void activa.offsetWidth; // fuerza repaint para animación
    activa.classList.add("animate-section-in");
  }
};

export const SECCIONES = {
  dashboard: document.getElementById("seccionDashboard"),
  agregar: document.getElementById("seccionAgregar"),
  consultar: document.getElementById("seccionConsultar"),
  sugerencias: document.getElementById("seccionSugerencias"),
};
