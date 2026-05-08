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
                    backgroundColor: color + 'CC', // El 'CC' le da un 80% de opacidad
                    borderColor: color,
                    borderWidth: 1,
                    borderRadius: 4, // Bordes redondeados para estilo moderno
                    hoverBackgroundColor: color
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false } // Menos ruido visual
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: "#f3f4f6", drawBorder: false },
                        ticks: { color: "#6b7280", font: { size: 11 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: "#6b7280", font: { size: 10 } }
                    }
                },
                // Añadimos esto para que las barras se vean más elegantes
                barPercentage: 0.7,
                categoryPercentage: 0.8
            }
        });
    }
};

// ESTA LÍNEA ES CLAVE:
window.Charts = Charts;