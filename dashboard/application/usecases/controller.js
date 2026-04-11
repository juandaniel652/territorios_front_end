// application/usecases/controller.js
import { Api }        from "../../infrastructure/api/api.js";
import { Validators } from "../../domain/validators.js";

export async function consultarAsignaciones(numero, ui) {
    ui.limpiarResultados();
    if (!Validators.territorioValido(numero)) {
        ui.mostrarErrorResultados("Ingrese un número de territorio válido.");
        return;
    }
    try {
        const territorio = await Api.getTerritorio(numero);
        ui.renderAsignaciones(territorio.numero, territorio.asignaciones);
    } catch (error) {
        console.error("❌ Error en consulta:", error);
        ui.mostrarErrorResultados(error.detail || "Error al consultar el backend.");
    }
}

export async function crearAsignacion(asignacionData, ui, onSuccess) {
    if (!Validators.asignacionCompleta(asignacionData)) {
        ui.mostrarMensaje("Completá todos los campos.", "error");
        return;
    }
    try {
        const result = await Api.crearAsignacion(asignacionData);
        ui.mostrarMensaje(result.message || "Asignación guardada.", "success");
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error("❌ Error al crear:", error);
        ui.mostrarMensaje(error.detail || "Error al guardar asignación.", "error");
    }
}

export async function cargarSugerencias(rango, ui) {
    try {
        const data = await Api.getSugerencias(rango);
        // Llamamos solo a renderSugerencias. 
        // El gráfico se dibuja automáticamente dentro de esa función en ui.js
        ui.renderSugerencias(data.sugerencias);
    } catch (error) {
        console.error("❌ Error en sugerencias:", error);
        ui.mostrarErrorResultados("Error al obtener sugerencias.");
    }
}

export async function editarAsignacion(id, campos, ui, onSuccess) {
    try {
        const result = await Api.editarAsignacion(id, campos);
        ui.mostrarMensaje(result.message || "Asignación actualizada.", "success");
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error("❌ Error al editar:", error);
        ui.mostrarMensaje(error.detail || "Error al actualizar asignación.", "error");
    }
}

export async function eliminarAsignacion(id, ui, onSuccess) {
    try {
        const result = await Api.eliminarAsignacion(id);
        ui.mostrarMensaje(result.message || "Asignación eliminada.", "success");
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error("❌ Error al eliminar:", error);
        ui.mostrarMensaje(error.detail || "Error al eliminar asignación.", "error");
    }
}