// dashboard/main.js
import { Controller } from './controller/dashboard.controller.js';
import { UIManager }  from './ui/ui.js';
import { initGlobalEvents } from './ui/events.js';

async function bootstrap() {
    try {
        console.log("🚀 Inicializando Dashboard...");
        
        // 1. Registrar eventos primero (para que la UI responda aunque la API tarde)
        initGlobalEvents();
        
        if (UIManager.initDatePickers) {
            UIManager.initDatePickers(); 
        }

        // 2. Cargar datos (esto puede tardar si Render está frío)
        await Controller.cargarDashboardCompleto(3);

        console.log("✅ Dashboard listo");
    } catch (error) {
        console.error("❌ Error en el arranque:", error);
    }
}

// Solo una vez
document.addEventListener('DOMContentLoaded', bootstrap);