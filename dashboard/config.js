// ===============================
// config.js: Responsabilidad: configuración global (URLs, flags, etc.)
// ===============================
const isLocal = window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1";

export const CONFIG = {
  BASE_URL: isLocal
    ? "http://127.0.0.1:8000"
    : "https://backend-territorios.onrender.com"
};
