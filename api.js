// ===============================
// api.js (responsabilidad: comunicación HTTP)
// ===============================
// ===============================
// api.js (responsabilidad: comunicación HTTP)
// ===============================
import { CONFIG } from "./config.js";

export const Api = {

  async getTerritorio(numero) {
    const res = await fetch(`${CONFIG.BASE_URL}/territorios/${numero}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async crearAsignacion(data) {
    const res = await fetch(`${CONFIG.BASE_URL}/asignaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (!res.ok) throw result;
    return result;
  },

  async getSugerencias(rango) {
    const res = await fetch(
      `${CONFIG.BASE_URL}/territorios/sugerencias?rango=${rango}`
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Error al obtener sugerencias");
    }

    return res.json();
  }
};
