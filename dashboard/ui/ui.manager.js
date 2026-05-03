// dashboard/ui/ui.manager.js
import { Components } from './components.js';
import { Charts }     from './charts.js';

export const UIManager = {
    /**
     * Renderiza el estado principal del Dashboard
     */
    renderDashboard(stats) {
        // Actualizar contadores superiores
        this._updateElementText("totalAsignaciones", stats.total_asignaciones);
        this._updateElementText("territoriosActivos", stats.territorios_activos);
        this._updateElementText("asignacionesCompletadas", stats.asignaciones_completadas);

        // Renderizar Gráfico
        if (Charts?.renderBarChart) {
            Charts.renderBarChart(
                document.getElementById("asignacionesChart"), 
                stats.chart_data?.labels || [], 
                stats.chart_data?.values || []
            );
        }

        // CONTROL CRÍTICO: Mostrar S-13 (Punto solicitado)
        const seccionS13 = document.getElementById("seccionPlanillaS13");
        if (seccionS13) {
            seccionS13.classList.remove("hidden");
            this.renderPlanillaS13(stats.territorios_detalle || []);
        }
    },

    /**
     * Renderiza la Planilla S-13 usando el generador de componentes
     */
    renderPlanillaS13(data) {
        const tbody = document.getElementById("tbodyS13");
        if (!tbody) return;
        
        // Delegamos la creación del HTML al componente especializado (SOLID: S)
        tbody.innerHTML = Components.createS13Rows(data);
    },

    /**
     * Método helper privado para evitar errores de DOM
     */
    _updateElementText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value || 0;
    },

    mostrarMensaje(texto, tipo = "success") {
        const msg = document.getElementById("mensaje");
        if (!msg) return;
        msg.textContent = texto;
        msg.className = tipo === "success" ? "msg-success" : "msg-error";
        setTimeout(() => { msg.textContent = ""; msg.className = ""; }, 4000);
    }
};