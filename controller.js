// ===============================
// controller.js (orquestador)
// ===============================
export async function consultarAsignaciones(numero) {
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
    console.error(error);
  }
}

export async function enviarAsignacion(asignacion) {
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
    console.error(error);
  }
}