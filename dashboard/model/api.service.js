// dashboard/model/api.service.js
import { CONFIG, getHeaders, handleResponse } from "../config.js";

export const Api = {
    async obtenerSugerencias(rangoStr) {
        try {
            // 1. Llamamos al API pasando el string para que el Model decida qué ID mandar al back
            const data = await Api.getSugerencias(rangoStr);
            const listaSugerida = Array.isArray(data) ? data : (data.sugerencias || []);
        
            // 2. FILTRADO LÓGICO: Obtenemos min y max del string "21-40"
            const [min, max] = rangoStr.split('-').map(Number);
        
            // 3. Filtramos para que la UI no muestre territorios fuera del bloque visual
            const listaFiltrada = listaSugerida.filter(s => s.numero >= min && s.numero <= max);
        
            // 4. Renderizamos
            UIManager.renderSugerencias(listaFiltrada);
        
        } catch (error) {
            UIManager.mostrarErrorResultados("No se pudieron cargar las sugerencias.");
        }
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