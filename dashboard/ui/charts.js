// ui/charts.js
let chartVistaGeneral = null;

export const Charts = {
    renderBarChart(canvasId, labels, values, color = "#3b82f6") {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        if (chartVistaGeneral) {
            chartVistaGeneral.destroy();
        }

        const ctx = canvas.getContext("2d");
        chartVistaGeneral = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Días de atraso",
                    data: values,
                    backgroundColor: color,
                    borderRadius: 5,
                    barPercentage: 0.6 // Barras más finas y elegantes
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false } // Quitamos leyendas innecesarias
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Días' },
                        grid: { color: "#f3f4f6" }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }
};