// ui/charts.js
let chartInstance = null; // Usamos un solo nombre consistente

export const Charts = {
    renderBarChart(canvasId, labels, values, color = "#22c55e") {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Limpieza de instancia previa para evitar el error de "Canvas in use"
        if (chartInstance) {
            chartInstance.destroy();
        }

        const ctx = canvas.getContext("2d");

        chartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels, // Ahora pasamos el array de etiquetas
                datasets: [{
                    label: "Asignaciones",
                    data: values, // Ahora pasamos el array de números
                    backgroundColor: color,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: "#eef0f5" } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
};

window.Charts = Charts;