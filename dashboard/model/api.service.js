import { CONFIG } from "../config.js";
import { AuthService } from "./auth.service.js";

const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${AuthService.getToken()}`
});

const handleResponse = async (res) => {
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
};

export const Api = {
    /**
     * Obtiene sugerencias y datos de la S-13
     */
    async getSugerencias(rango = 3) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/territorios/sugerencias?rango=${rango}`, { 
            headers: getHeaders() 
        });
        return handleResponse(res);
    },

    /**
     * Genera el plan de 15 días en el backend
     */
    async generarPlanQuincenal(fechaInicio) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/territorios/generar-plan?fecha_inicio=${fechaInicio}`, { 
            headers: getHeaders() 
        });
        return handleResponse(res);
    },

    async confirmarAgenda(payload) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/confirmar-agenda`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(payload)
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