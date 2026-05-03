import { Controller } from './controller/dashboard.controller.js';
import { UIManager }  from './ui/ui.manager.js';
import { initGlobalEvents } from './ui/events.js';

async function bootstrap() {
    try {
        console.log("🚀 Inicializando Dashboard MVC...");
        
        // 1. El Controller se encarga de orquestar la carga inicial
        await Controller.cargarDashboardCompleto(3, UIManager);
        
        // 2. Inicializamos eventos de la interfaz
        UIManager.initDatePickers?.(); 
        initGlobalEvents();

        console.log("✅ Dashboard listo");
    } catch (error) {
        console.error("❌ Error en el arranque:", error);
        UIManager.mostrarMensaje("Error al conectar con el servidor", "error");
    }
}

document.addEventListener('DOMContentLoaded', bootstrap);