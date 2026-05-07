// ui/charts.js
let instanceProgreso = null;

export const Charts = {
    renderBarChart(canvasId, labels, values, color = "#22c55e") {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        if (instanceProgreso) {
            instanceProgreso.destroy();
        }

        const ctx = canvas.getContext("2d");
        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Asignaciones",
                    data: values,
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