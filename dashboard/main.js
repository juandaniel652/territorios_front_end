// dashboard/main.js
import { Controller } from './controller/dashboard.controller.js';
import { UIManager }  from './ui/ui.js';
import { initGlobalEvents } from './ui/events.js';

async function bootstrap() {
    console.log("🚀 Inicializando Dashboard...");
    initGlobalEvents(); // Esto registra los clicks de una
    
    if (UIManager.initDatePickers) UIManager.initDatePickers();

    // Cargamos datos en segundo plano sin 'await' para no trabar el inicio
    Controller.cargarDashboardCompleto(3).catch(err => {
        if(err.status === 401) window.location.href = "../login/index.html";
    });

    console.log("✅ UI lista para interactuar");
}

// Solo una vez
document.addEventListener('DOMContentLoaded', bootstrap);