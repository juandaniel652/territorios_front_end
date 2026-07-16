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
    // 🚨 Interceptor de Sesión Expirada (401 Unauthorized)
    if (response.status === 401) {
        console.warn("⚠️ Código 401 detectado: Sesión expirada.");
        
        // Importamos el Modal dinámicamente para evitar referencias circulares entre UI y Config
        import("./ui/modals.js")
            .then(({ Modals }) => {
                Modals.abrirSesionExpirada();
            })
            .catch(err => {
                console.error("Error cargando el modal de sesión expirada:", err);
                // Fallback clásico si algo falla cargando el módulo
                alert("Tu sesión expiró. Por favor, volvé a iniciar sesión.");
                window.location.href = "/login/";
            });

        throw new Error("No se pudo validar el token");
    }

    // Tu lógica actual para procesar respuestas del backend...
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error en la petición: ${response.status}`);
    }

    // Retorna el JSON normalmente si todo salió bien
    return response.json();
}