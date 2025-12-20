// ===============================
// events.js (eventos)
// ===============================
DOM.consultarBtn.addEventListener("click", () => {
  consultarAsignaciones(DOM.territorioInput.value.trim());
});

DOM.form.addEventListener("submit", e => {
  e.preventDefault();

  const asignacion = {
    numero_territorio: parseInt(DOM.inputs.numeroTerritorio.value),
    conductor: DOM.inputs.conductor.value.trim(),
    fecha_asignado: DOM.inputs.fechaAsignado.value,
    fecha_completado: DOM.inputs.fechaCompletado.value,
    total_abarcado: DOM.inputs.totalAbarcado.value.trim()
  };

  enviarAsignacion(asignacion);
});
