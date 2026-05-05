// dashboard/model/api.service.js
import { CONFIG, getHeaders, handleResponse } from "../config.js";

export const Api = {

    async getSugerencias(rangoStr) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/territorios/sugerencias?rango=${rangoStr}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async obtenerSugerencias(rangoStr) {
        try {
            // Llamamos al método que definimos arriba
            const data = await Api.getSugerencias(rangoStr);
            
            // Si el backend devuelve { sugerencias: [...] }, extraemos la lista
            const listaSugerida = data.sugerencias || data; 
        
            const [min, max] = rangoStr.split('-').map(Number);
        
            // Filtrado de seguridad
            const listaFiltrada = listaSugerida.filter(s => s.numero >= min && s.numero <= max);
        
            // IMPORTANTE: Asegurate de que UIManager esté disponible o importado
            if (window.UIManager) {
                window.UIManager.renderSugerencias(listaFiltrada);
            }
            
            return listaFiltrada; // Por si el controller necesita el dato
        
        } catch (error) {
            console.error("Error en obtenerSugerencias:", error);
            if (window.UIManager) {
                window.UIManager.mostrarErrorResultados("No se pudieron cargar las sugerencias.");
            }
            throw error;
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