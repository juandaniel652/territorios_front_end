// dashboard/main.js
import { Controller } from './controller/dashboard.controller.js';
import { UIManager }  from './ui/ui.js';
import { initGlobalEvents } from './ui/events.js';

async function bootstrap() {
    console.log("🚀 Inicializando Dashboard...");
    
    // 1. Setup de UI y Eventos Globales
    initGlobalEvents(); 
    if (UIManager.initDatePickers) UIManager.initDatePickers();

    // 2. Vincular eventos de los botones de rango (Limpio)
    const configurarRangos = () => {
        const rangos = {
            'btnRango1': '1-20',
            'btnRango2': '21-40',
            'btnRango3': '41-60'
        };

        Object.entries(rangos).forEach(([id, valor]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => Controller.cargarDashboardCompleto(valor));
            }
        });
    };
    configurarRangos();

    // 3. Estado inicial
    UIManager.cambiarSeccion("btnDashboard");

    try {
        // Carga inicial (una sola vez)
        await Controller.cargarDashboardCompleto("1-20");
        console.log("✅ UI lista para interactuar");
    } catch (err) {
        console.error("Error al arrancar dashboard:", err);
        if (err.status === 401) window.location.href = "../login/index.html";
    }
}

// Un solo punto de entrada
document.addEventListener('DOMContentLoaded', bootstrap);