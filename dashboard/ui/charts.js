// ui/charts.js
let myChart = null;

export const Charts = {
    renderBarChart(canvasId, labels, values, color = "#3b82f6") {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Si ya existe un gráfico, lo destruimos para poder crear el nuevo
        const existingChart = Chart.getChart(canvasId);
        if (existingChart) {
            existingChart.destroy();
        }

        const ctx = canvas.getContext("2d");
        myChart = new Chart(ctx, {
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
                scales: {
                    y: {
                        beginAtZero: true,
                        // Esto asegura que las barras tengan espacio para crecer
                        suggestedMax: 10, 
                        ticks: {
                            stepSize: 5, // Muestra de 5 en 5 días
                            color: '#6b7280'
                        },
                        grid: { color: '#f3f4f6' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#6b7280' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
};

// ESTA LÍNEA ES CLAVE:
window.Charts = Charts;