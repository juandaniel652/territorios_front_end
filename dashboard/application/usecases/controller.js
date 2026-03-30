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
        console.error(error);
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
        console.error(error);
        ui.mostrarMensaje(error.detail || "Error al guardar asignación.", "error");
    }
}

export async function cargarSugerencias(rango, ui) {
    try {
        const data = await Api.getSugerencias(rango);
        ui.renderSugerencias(data.sugerencias);
        ui.renderGraficoSugerencias(data.sugerencias);
    } catch (error) {
        console.error(error);
        ui.mostrarErrorResultados("Error al obtener sugerencias.");
    }
}
