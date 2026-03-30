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
        const res = await fetch(`${CONFIG.BASE_URL}api/v1/territorios/${numero}`, { headers: authHeaders() });
        const data = await handleResponse(res);
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
    }
};