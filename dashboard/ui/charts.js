// ui/charts.js
let myChart = null;

export const Charts = {
    renderBarChart(canvasId, labels, values, color = "#10b981") {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

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
                    // Usamos el color sólido para evitar errores de transparencia
                    backgroundColor: color, 
                    borderRadius: 5,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 500 // Animación rápida y sobria
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: 15, // Un poco más de margen
                        ticks: {
                            stepSize: 2, // Escala de 2 en 2 días (más granular)
                            color: '#6b7280',
                            font: { size: 11 }
                        },
                        grid: { color: '#f3f4f6', drawBorder: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: '#6b7280', 
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        titleFont: { size: 13 },
                        bodyFont: { size: 12 },
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: (context) => ` Atraso: ${context.raw} días`
                        }
                    }
                }
            }
        });
    }
};

window.Charts = Charts;