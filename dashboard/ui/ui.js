// ui/ui.js
import { DOM } from "./dom.js";

let chartInstance = null;

export const UI = {
    limpiarResultados() {
        DOM.resultadoDiv.innerHTML = "";
    },

    mostrarErrorResultados(msg) {
        DOM.resultadoDiv.innerHTML = `
            <div class="result-error">
                <span>⚠</span><p>${msg}</p>
            </div>`;
    },

    mostrarMensaje(texto, tipo = "success") {
        DOM.mensaje.textContent = texto;
        DOM.mensaje.className   = tipo === "success" ? "msg-success" : "msg-error";
        setTimeout(() => { DOM.mensaje.textContent = ""; DOM.mensaje.className = ""; }, 4000);
    },

    renderAsignaciones(numero, asignaciones) {
        if (!asignaciones.length) {
            DOM.resultadoDiv.innerHTML = `<p class="result-empty">Sin asignaciones para el territorio <strong>${numero}</strong>.</p>`;
            return;
        }
        const filas = asignaciones.map(a => `
            <tr>
                <td>${a.conductor}</td>
                <td>${a.fecha_asignado}</td>
                <td>${a.fecha_completado}</td>
                <td>${a.total_abarcado}</td>
            </tr>`).join("");

        DOM.resultadoDiv.innerHTML = `
            <p class="result-title">Territorio ${numero}</p>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead><tr>
                        <th>Conductor</th>
                        <th>Asignado</th>
                        <th>Completado</th>
                        <th>Total abarcado</th>
                    </tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    },

    renderSugerencias(sugerencias) {
        const container = DOM.resultadoSugerencias;
        if (!sugerencias?.length) {
            container.innerHTML = `<p class="result-empty">No hay sugerencias disponibles.</p>`;
            return;
        }
        container.innerHTML = sugerencias.map(s => `
            <div class="sugerencia-card">
                <span class="sugerencia-card__num">T-${s.numero}</span>
                <div class="sugerencia-card__info">
                    <p class="sugerencia-card__last">Última: ${s.ultima_fecha ?? "—"}</p>
                    <p class="sugerencia-card__days">Sin asignar: <strong>${s.dias_atraso ?? "—"} días</strong></p>
                    <p class="sugerencia-card__sev">Severidad: ${s.severidad}</p>
                </div>
            </div>`).join("");
    },


    renderGraficoSugerencias(sugerencias) {
        const canvas = document.getElementById("asignacionesChart");
        if (!canvas || !sugerencias?.length) return;
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(canvas, {
            type: "bar",
            data: {
                labels: sugerencias.map(s => `T-${s.numero}`),
                datasets: [{
                    label: "Días sin asignar",
                    data: sugerencias.map(s => s.dias_atraso ?? 0),
                    backgroundColor: "rgba(34, 197, 94, 0.2)",
                    borderColor: "#16a34a",
                    borderWidth: 2,
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" } }
                }
            }
        });
    }

};
