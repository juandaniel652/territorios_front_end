// infrastructure/api/api.js
import { CONFIG }      from "../../config.js";
import { AuthService } from "../auth/AuthService.js";
import { Territorio }  from "../../domain/entities/Territorio.js";
import { Asignacion }  from "../../domain/entities/Asignacion.js";

function authHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AuthService.getToken()}`
    };
}

async function handleResponse(res) {
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
}

export const Api = {
    async getTerritorio(numero) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/territorios/${numero}`, { headers: authHeaders() });
        console.log("📡 status:", res.status);        // ← AGREGÁ
        const data = await handleResponse(res);
        console.log("📡 data cruda del backend:", data); // ← AGREGÁ
        return new Territorio({ numero, asignaciones: data.asignaciones ?? [] });
    },

    async crearAsignacion(asignacionData) {
        const asignacion = new Asignacion(asignacionData);
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(asignacion)
        });
        return handleResponse(res);
    },

    // ── NUEVO ────────────────────────────────────────────────────────────────
    async editarAsignacion(id, campos) {
        /**
         * campos: objeto con solo los campos que cambiaron.
         * El backend aplica patch semántico — lo que no llega no se toca.
         */
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(campos)
        });
        return handleResponse(res);
    },

    async eliminarAsignacion(id) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });
        return handleResponse(res);
    },
    // ── FIN NUEVO ────────────────────────────────────────────────────────────

    async getSugerencias(rango) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/territorios/sugerencias?rango=${rango}`, { headers: authHeaders() });
        return handleResponse(res);
    },

    async generarPlanQuincenal(fechaInicio) {
        // GET /territorios/generar-plan?fecha_inicio=2026-04-20
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/territorios/generar-plan?fecha_inicio=${fechaInicio}`, { 
            headers: authHeaders() 
        });
        return handleResponse(res);
    },

    async confirmarAgenda(datosAgenda) {
        // POST /asignaciones/confirmar-agenda
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/asignaciones/confirmar-agenda`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(datosAgenda)
        });
        return handleResponse(res);
    },

    async actualizarSalida(id, datos) {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/salidas/${id}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify(datos)
        });
        return handleResponse(res);
    },

    async obtenerSalidasQuincena(fechaBase = "") {
        // Si hay fecha, la agregamos como query param
        const url = fechaBase ? `/salidas/quincena?fecha_base=${fechaBase}` : `/salidas/quincena`;
        const response = await fetch(`${this.baseUrl}${url}`);
        if (!response.ok) throw new Error("Error en red");
        return await response.json();
    },

    async obtenerAgendaGuardada() {
        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/salidas/quincena`, { 
            headers: authHeaders() 
        });
        return handleResponse(res);
    }
};