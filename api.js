// ===============================
// api.js (responsabilidad: comunicación HTTP)
// ===============================
import { CONFIG } from "./config.js";

export const Api = {
  async getTerritorio(numero) {
    const response = await fetch(`${CONFIG.BASE_URL}/territorios/${numero}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  async crearAsignacion(data) {
    const response = await fetch(`${CONFIG.BASE_URL}/asignaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (!response.ok) throw result;
    return result;
  }
};