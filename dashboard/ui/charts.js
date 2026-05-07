// ui/charts.js
let chartInstance = null; 

export const Charts = {
    renderBarChart(canvasId, labels, values, color = "#3b82f6") {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Si ya existe un gráfico, lo destruimos para poder crear el nuevo
        if (chartInstance) {
            chartInstance.destroy();
        }

        const ctx = canvas.getContext("2d");
        chartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Días de atraso",
                    data: values,
                    backgroundColor: color,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    }
};

// ESTA LÍNEA ES CLAVE:
window.Charts = Charts;