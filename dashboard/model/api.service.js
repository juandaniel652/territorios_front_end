// dashboard/model/api.service.js
import { CONFIG, getHeaders, handleResponse } from "../config.js";

export const Api = {

    // --- TERRITORIOS & SUGERENCIAS ---
    async getSugerencias(rangoStr) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/territorios/sugerencias?rango=${rangoStr}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async getTerritorio(numero) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/territorios/${numero}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // --- MOTOR DE AGENDA (Rutas sincronizadas con tu FastAPI) ---
    async generarPlanQuincenal(fechaInicio) {
        // En tu backend es GET y está en territorios
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/territorios/generar-plan?fecha_inicio=${fechaInicio}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async confirmarAgenda(payload) {
        // IMPORTANTE: En tu backend está en /asignaciones/confirmar-agenda
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/confirmar-agenda`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(res);
    },

    async getHistorialAgenda() {
        // Ahora sí va a existir porque lo agregamos arriba
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/historial`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // --- CRUD DE ASIGNACIONES INDIVIDUALES ---
    async crearAsignacion(datos) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(datos)
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

window.Api = Api;