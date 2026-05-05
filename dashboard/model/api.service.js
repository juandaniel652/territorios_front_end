// dashboard/model/api.service.js
import { CONFIG, getHeaders, handleResponse } from "../config.js";

export const Api = {
    async getSugerencias(rangoId) {
        
        // Si viene "1-20" o "1", nos quedamos solo con el primer dígito como entero
        const valorLimpio = parseInt(rangoId); 
        
        
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/sugerencias?rango=${valorLimpio}`, {
            headers: getHeaders() // Esto debe ir perfecto
        });
        return handleResponse(res);
    },

    async getTerritorio(numero) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/territorios/${numero}`, {
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