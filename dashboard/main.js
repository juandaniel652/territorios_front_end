import { Controller } from './controller/dashboard.controller.js';
import { UIManager }  from './ui/ui.js';
import { initGlobalEvents } from './ui/events.js';

async function bootstrap() {
    console.log("🚀 Inicializando Dashboard...");
    
    // 1. Setup de UI y Eventos Globales
    initGlobalEvents(); 
    
    // Inicializamos los selectores dinámicos de fechas (8 domingos atrás)
    UIManager.configurarSelectoresFechaAsignacion();

    // 2. Vincular eventos de los botones de rango (Sugerencias)
    const btnBuscarSugerencias = document.getElementById("btnBuscarSugerencias");
    if (btnBuscarSugerencias) {
        btnBuscarSugerencias.addEventListener("click", () => {
            const rango = document.getElementById("rangoSelect").value;
            // Usamos el Controller para cargar las sugerencias
            Controller.obtenerSugerencias(rango);
        });
    }

    // 3. Eventos de la SECCIÓN AGENDA (Nuevos)
    const btnGenerar = document.getElementById("btnGenerarPropuesta");
    if (btnGenerar) {
        btnGenerar.addEventListener("click", () => {
            const fecha = document.getElementById("fechaInicioAgenda").value;
            if (!fecha) return alert("Por favor, seleccioná una fecha de inicio.");
            // OJO: Usamos 'Controller' que es como lo importaste arriba
            Controller.generarPropuesta(fecha);
        });
    }

    const btnConfirmar = document.getElementById("btnConfirmarAgenda");
    if (btnConfirmar) {
        btnConfirmar.addEventListener("click", () => {
            if (confirm("¿Estás seguro de que querés guardar esta planificación?")) {
                Controller.confirmarAgenda();
            }
        });
    }

    // 4. Estado inicial
    UIManager.cambiarSeccion("btnDashboard");

    try {
        // Cargamos los KPIs iniciales y el gráfico
        await Controller.cargarDashboardCompleto("1-20");
        
        // Cargamos el historial de agendas de forma silenciosa
        await Controller.cargarHistorial(); 
        
        console.log("✅ UI lista para interactuar");
    } catch (err) {
        console.error("Error al arrancar dashboard:", err);
        // Si el error es de token expirado (401 o 403), redirigimos
        if (err.status === 401 || err.status === 403) {
            window.location.href = "../login/index.html";
        }
    }
}

// Única ejecución al cargar el DOM
document.addEventListener('DOMContentLoaded', bootstrap);