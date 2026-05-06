// dashboard/main.js
import { Controller } from './controller/dashboard.controller.js';
import { UIManager }  from './ui/ui.js';
import { initGlobalEvents } from './ui/events.js';

async function bootstrap() {
    console.log("🚀 Inicializando Dashboard...");
    initGlobalEvents(); 
    
    if (UIManager.initDatePickers) UIManager.initDatePickers();

    // Forzamos visualmente la sección Dashboard al arrancar
    UIManager.cambiarSeccion("btnDashboard"); // Suponiendo que tu botón se llama así

    try {
        await Controller.cargarDashboardCompleto("1-20");
    } catch (err) {
        console.error("Error al arrancar dashboard:", err);
        if(err.status === 401) window.location.href = "../login/index.html";
    }

    console.log("✅ UI lista para interactuar");
}

// Solo una vez
document.addEventListener('DOMContentLoaded', bootstrap);