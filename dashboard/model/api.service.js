// dashboard/model/api.service.js
import { CONFIG, getHeaders, handleResponse } from "../config.js";

export const Api = {
    async getSugerencias(rango = 3) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/sugerencias?rango=${rango}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async generarPlanQuincenal(fechaInicio) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/generar-quincena`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ fecha_inicio: fechaInicio })
        });
        return handleResponse(res);
    },

    async confirmarAgenda(payload) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/confirmar-agenda`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(res);
    },

    async obtenerSalidasQuincena(fecha) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/historial?fecha=${fecha}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async actualizarSalida(id, datos) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(datos)
        });
        return handleResponse(res);
    },

    async eliminarAsignacion(id) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/${id}`, {
            method: "DELETE",
            headers: getHeaders()
        });
        return handleResponse(res);
    }
};