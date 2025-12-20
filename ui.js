// ===============================
// ui.js (responsabilidad: render y feedback visual)
// ===============================

import { DOM , SECCIONES} from "./dom.js";


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

export function renderSugerencias(lista) {
  if (!lista.length) {
    DOM.resultadoSugerencias.textContent = "Sin resultados";
    return;
  }

  DOM.resultadoSugerencias.innerHTML = lista
    .map(t => {
      const fecha = t.ultima_fecha ?? "NUNCA";
      const dias = t.dias_atraso !== null
        ? `${t.dias_atraso} días`
        : "—";

      const clase = colorPorSeveridad(t.severidad);

      return `
        <div class="p-3 mb-2 rounded ${clase}">
          <strong>Territorio ${t.numero}</strong><br>
          Última vez: ${fecha}<br>
          Atraso: ${dias}
        </div>
      `;
    })
    .join("");
}


let chartSugerencias = null;

export function renderGraficoSugerencias(lista) {
  const labels = lista.map(t => `T ${t.numero}`);
  const data = lista.map(t => t.dias_atraso ?? 0);

  const colores = lista.map(t => {
    if (t.severidad === "critico") return "rgba(239,68,68,0.7)";
    if (t.severidad === "alto") return "rgba(234,179,8,0.7)";
    if (t.severidad === "normal") return "rgba(34,197,94,0.7)";
    return "rgba(156,163,175,0.7)";
  });

  const ctx = document.getElementById("asignacionesChart");

  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    existingChart.destroy();
  }

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Días de atraso",
        data,
        backgroundColor: colores
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}


export function colorPorSeveridad(severidad) {
  switch (severidad) {
    case "critico": return "bg-red-100 text-red-800";
    case "alto": return "bg-yellow-100 text-yellow-800";
    case "normal": return "bg-green-100 text-green-800";
    case "nunca": return "bg-gray-100 text-gray-600";
    default: return "";
  }
}

export function mostrarSeccion(nombre) {
  Object.values(SECCIONES).forEach(sec => sec.classList.add("hidden"));
  SECCIONES[nombre].classList.remove("hidden");
}