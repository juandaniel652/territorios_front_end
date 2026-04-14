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
    // Debug: ver qué llega al validador
    console.log("Validando asignación:", asignacionData);

    // Si el validador falla, revisá domain/validators.js, pero por ahora 
    // aseguremonos de que si hay datos, pase.
    if (!asignacionData.numero_territorio || !asignacionData.conductor || !asignacionData.fecha_asignado) {
        ui.mostrarMensaje("Faltan datos esenciales (Territorio, Conductor o Fecha).", "error");
        return;
    }

    try {
        const result = await Api.crearAsignacion(asignacionData);
        ui.mostrarMensaje(result.message || "Asignación guardada con éxito.", "success");
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error("❌ Error al crear:", error);
        ui.mostrarMensaje(error.detail || "Error al guardar en el servidor.", "error");
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

// Agregá estos exports al final del archivo

export async function prepararAgendaQuincenal(fechaInicio, ui) {
    ui.mostrarCarga(true); // Si tenés un spinner
    try {
        const plan = await Api.generarPlanQuincenal(fechaInicio);
        // El plan es un array de {fecha, turno, territorio_id, numero, zona}
        ui.renderVistaPreviaAgenda(plan); 
    } catch (error) {
        console.error("❌ Error generando plan:", error);
        ui.mostrarMensaje("Error al generar la propuesta de agenda.", "error");
    } finally {
        ui.mostrarCarga(false);
    }
}

export async function confirmarAgendaDefinitiva(planRecibido, conductorDefault, ui, onSuccess) {
    try {
        // Mapeamos el plan al formato que espera el backend (AgendaConfirmar)
        const payload = {
            conductor_default: conductorDefault || "Sin Asignar",
            items: planRecibido.map(item => ({
                territorio_id: item.territorio_id,
                fecha_asignado: item.fecha, // 'fecha' viene del backend como YYYY-MM-DD
                turno: item.turno
            }))
        };

        const result = await Api.confirmarAgenda(payload);
        ui.mostrarMensaje(result.message, "success");
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error("❌ Error confirmando agenda:", error);
        ui.mostrarMensaje(error.detail || "Error al impactar la agenda en la DB.", "error");
    }
}