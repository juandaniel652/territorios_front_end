// application/usecases/controller.js
import { Api }         from "../../infrastructure/api/api.js";
import { Validators }  from "../../domain/validators.js";

export async function consultarAsignaciones(numero, uiInterface) {
    uiInterface.limpiarResultados();
    if (!Validators.territorioValido(numero)) {
        uiInterface.mostrarErrorResultados("Ingrese un número de territorio válido.");
        return;
    }
    try {
        const territorio = await Api.getTerritorio(numero);
        uiInterface.renderAsignaciones(territorio.numero, territorio.asignaciones);
    } catch (error) {
        console.error("❌ Error en consulta:", error);
        uiInterface.mostrarErrorResultados(error.detail || "Error al consultar el backend.");
    }
}

export async function crearAsignacion(asignacionData, uiInterface, onSuccess) {
    console.log("Validando asignación:", asignacionData);

    if (!asignacionData.numero_territorio || !asignacionData.conductor || !asignacionData.fecha_asignado) {
        uiInterface.mostrarMensaje("Faltan datos esenciales (Territorio, Conductor o Fecha).", "error");
        return;
    }

    try {
        const result = await Api.crearAsignacion(asignacionData);
        uiInterface.mostrarMensaje(result.message || "Asignación guardada con éxito.", "success");
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error("❌ Error al crear:", error);
        uiInterface.mostrarMensaje(error.detail || "Error al guardar en el servidor.", "error");
    }
}

export async function cargarSugerencias(rango, uiInterface) {
    try {
        const data = await Api.getSugerencias(rango);
        uiInterface.renderSugerencias(data.sugerencias);
    } catch (error) {
        console.error("❌ Error en sugerencias:", error);
        uiInterface.mostrarErrorResultados("Error al obtener sugerencias.");
    }
}

export async function editarAsignacion(id, campos, uiInterface, onSuccess) {
    try {
        const result = await Api.editarAsignacion(id, campos);
        uiInterface.mostrarMensaje(result.message || "Asignación actualizada.", "success");
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error("❌ Error al editar:", error);
        uiInterface.mostrarMensaje(error.detail || "Error al actualizar asignación.", "error");
    }
}

export async function eliminarAsignacion(id, uiInterface, onSuccess) {
    try {
        const result = await Api.eliminarAsignacion(id);
        uiInterface.mostrarMensaje(result.message || "Asignación eliminada.", "success");
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error("❌ Error al eliminar:", error);
        uiInterface.mostrarMensaje(error.detail || "Error al eliminar asignación.", "error");
    }
}

// --- FUNCIONES DE AGENDA (Donde saltaba el error de Tables) ---

export async function prepararAgendaQuincenal(fechaInicio, uiInterface) {
    uiInterface.mostrarCarga(true); 
    try {
        const plan = await Api.generarPlanQuincenal(fechaInicio);
        // Aquí uiInterface llamará a renderVistaPreviaAgenda que ya tiene el fix de _tables
        uiInterface.renderVistaPreviaAgenda(plan); 
    } catch (error) {
        console.error("❌ Error generando plan:", error);
        uiInterface.mostrarMensaje("Error al generar la propuesta de agenda.", "error");
    } finally {
        uiInterface.mostrarCarga(false);
    }
}

export async function confirmarAgendaDefinitiva(planRecibido, conductorDefault, uiInterface, onSuccess) {
    try {
        const payload = {
            conductor_default: conductorDefault || "Sin Asignar",
            items: planRecibido.map(item => ({
                territorio_id: item.territorio_id,
                fecha_asignado: item.fecha, 
                turno: item.turno
            }))
        };

        const result = await Api.confirmarAgenda(payload);
        uiInterface.mostrarMensaje(result.message, "success");
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error("❌ Error confirmando agenda:", error);
        uiInterface.mostrarMensaje(error.detail || "Error al impactar la agenda en la DB.", "error");
    }
}