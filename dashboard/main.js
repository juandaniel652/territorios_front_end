// dashboard/main.js
import { Controller } from './controller/dashboard.controller.js';
import { UIManager }  from './ui/ui.js'; // Ajustado a ui.js
import { initGlobalEvents } from './ui/events.js';

async function bootstrap() {
    try {
        console.log("🚀 Inicializando Dashboard MVC...");
        
        // 1. El Controller orquesta la carga inicial
        // Ya no pasamos UIManager porque el Controller lo importa internamente
        await Controller.cargarDashboardCompleto(3);
        
        // 2. Inicializamos eventos y componentes de terceros
        if (UIManager.initDatePickers) {
            UIManager.initDatePickers(); 
        }
        
        initGlobalEvents();

        console.log("✅ Dashboard listo y sincronizado");
    } catch (error) {
        console.error("❌ Error en el arranque:", error);
        // Fallback por si la UI no cargó
        const msg = document.getElementById("mensaje");
        if (msg) {
            msg.textContent = "Error crítico al conectar con el servidor";
            msg.className = "text-red-600 font-bold";
        }
    }
}

// Evento de arranque
document.addEventListener('DOMContentLoaded', bootstrap);