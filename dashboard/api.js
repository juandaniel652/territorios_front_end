// ===============================
// api.js (responsabilidad: comunicación HTTP con token JWT)
// ===============================
import { CONFIG } from "../dashboard/config.js";

export const Api = {
  // ------------------------------
  // Login
  // ------------------------------
  async login(email, password) {
    const res = await fetch(`${CONFIG.BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const result = await res.json();
    if (!res.ok) throw result;

    // Guardar token en localStorage
    localStorage.setItem("token", result.access_token);
    return result;
  },

  // ------------------------------
  // Logout
  // ------------------------------
  logout() {
    localStorage.removeItem("token");
  },

  // ------------------------------
  // Obtener token
  // ------------------------------
  getToken() {
    return localStorage.getItem("token");
  },

  // ------------------------------
  // Obtener asignaciones por territorio
  // ------------------------------
  async getTerritorio(numero) {
    const token = this.getToken();
    if (!token) throw { detail: "No autorizado" };

    const res = await fetch(`${CONFIG.BASE_URL}/territorios/${numero}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw err;
    }

    return res.json();
  },

  // ------------------------------
  // Crear asignación
  // ------------------------------
  async crearAsignacion(data) {
    const token = this.getToken();
    if (!token) throw { detail: "No autorizado" };

    const res = await fetch(`${CONFIG.BASE_URL}/asignaciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (!res.ok) throw result;
    return result;
  },

  // ------------------------------
  // Obtener sugerencias
  // ------------------------------
  async getSugerencias(rango) {
    const token = this.getToken();
    if (!token) throw { detail: "No autorizado" };

    const res = await fetch(
      `${CONFIG.BASE_URL}/territorios/sugerencias?rango=${rango}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Error al obtener sugerencias");
    }

    return res.json();
  }
};
