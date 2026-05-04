// dashboard/config.js
const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const CONFIG = {
    BASE_URL: isLocal
        ? "http://127.0.0.1:8000"
        : "https://backend-territorios.onrender.com"
};

/**
 * Genera los encabezados necesarios para las peticiones Fetch.
 */
export function getHeaders() {
    const headers = {
        "Content-Type": "application/json"
    };
    
    // Si en el futuro usas tokens (por ejemplo, de auth.service.js)
    const token = localStorage.getItem("token");
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    
    return headers;
}

/**
 * Manejador genérico de respuestas para centralizar errores de API.
 */
export async function handleResponse(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error del servidor: ${response.status}`);
    }
    return response.json();
}