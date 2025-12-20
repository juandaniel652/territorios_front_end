// ===============================
// ui.js (responsabilidad: render y feedback visual)
// ===============================

import { DOM } from "./dom.js";

export const UI = {
  mostrarMensaje(texto, tipo = "success") {
    DOM.mensaje.textContent = texto;
    DOM.mensaje.classList.remove("text-green-600", "text-red-600");
    DOM.mensaje.classList.add(tipo === "success" ? "text-green-600" : "text-red-600");
  },

  limpiarResultados() {
    DOM.resultadoDiv.innerHTML = "";
  },

  mostrarErrorResultados(texto) {
    DOM.resultadoDiv.innerHTML = `<p class="text-red-600">${texto}</p>`;
  },

  renderAsignaciones(numero, asignaciones) {
    if (!asignaciones.length) {
      DOM.resultadoDiv.innerHTML = "<p>No se encontraron asignaciones para este territorio.</p>";
      return;
    }

    let html = `<h3 class="font-semibold mb-2">Asignaciones del territorio ${numero}</h3>`;
    html += "<ul class='list-disc pl-5'>";

    asignaciones.forEach(a => {
      html += `<li class="mb-2">
        <strong>Conductor:</strong> ${a.conductor}<br>
        <strong>Fecha asignado:</strong> ${a.fecha_asignado || "—"}<br>
        <strong>Fecha completado:</strong> ${a.fecha_completado || "—"}<br>
        <strong>Total abarcado:</strong> ${a.cantidad_abarcado || "—"}
      </li>`;
    });

    html += "</ul>";
    DOM.resultadoDiv.innerHTML = html;
  }
};