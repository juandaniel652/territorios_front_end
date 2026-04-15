import { DateFormatter, agruparPorSemana } from "./utils.js";

export const Tables = {
    renderAsignaciones(numero, asignaciones) {
        const container = document.getElementById("resultadoTerritorio");
        if (!container) return;

        if (!asignaciones.length) {
            container.innerHTML = `<p class="result-empty">Sin asignaciones para el territorio <strong>${numero}</strong>.</p>`;
            return;
        }

        const filas = asignaciones.map(a => {
            const id = a.id ?? "";
            const tieneId = id !== "" && id !== null;

            // 2. Formatear las fechas para la vista
            const fechaAsignadoAR = DateFormatter.toArgentina(a.fecha_asignado);
            const fechaCompletadoAR = DateFormatter.toArgentina(a.fecha_completado);

            return `
            <tr>
                <td>${a.conductor ?? "—"}</td>
                <td>${fechaAsignadoAR}</td> 
                <td>${fechaCompletadoAR}</td>
                <td>${a.cantidad_abarcado ?? "—"}</td>
                <td>
                    <div class="row-actions">
                        <button class="btn-row-edit" 
                            data-id="${id}" 
                            data-conductor="${a.conductor ?? ""}"
                            data-fecha-asignado="${a.fecha_asignado ?? ""}"
                            data-fecha-completado="${a.fecha_completado ?? ""}"
                            data-cantidad="${a.cantidad_abarcado ?? ""}"
                            ${!tieneId ? "disabled" : ""}>Editar</button>
                        <button class="btn-row-delete" 
                            data-id="${id}" 
                            ${!tieneId ? "disabled" : ""}>Eliminar</button>
                    </div>
                </td>
            </tr>`;
        }).join("");

        container.innerHTML = `
            <h4 class="result-title">Historial: Territorio ${numero}</h4>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr><th>Conductor</th><th>Asignado</th><th>Completado</th><th>Abarcado</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    },


   // dashboard/ui/tables.js

    renderVistaPreviaAgenda(plan, conductores = []) {
        const container = document.getElementById("containerPropuesta");
        if (!container) return;

        // Agrupamos por semana para que no se mezclen
        // Asumiendo que el plan viene ordenado por fecha
        let html = `
            <div class="space-y-8">
                ${this._generarTablaSemana(plan.slice(0, 10), "Semana 1", "semana-1")}
                ${this._generarTablaSemana(plan.slice(10), "Semana 2", "semana-2")}
            </div>
            <div class="mt-6 flex justify-end">
                <button id="btnConfirmarAgenda" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all font-bold">
                    Confirmar y Archivar Agenda
                </button>
            </div>
        `;
        container.innerHTML = html;
    },

    _generarTablaSemana(items, titulo, claseSemana) {
        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 class="text-lg font-bold text-gray-800">${titulo}</h3>
                </div>
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th class="p-3">Día / Turno</th>
                            <th class="p-3">Punto de Encuentro</th>
                            <th class="p-3 text-center">Territorio</th>
                            <th class="p-3">Conductor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => this._renderFilaAgenda(item, claseSemana)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    _renderFilaAgenda(item, claseSemana) {
        const diaNombre = new Date(item.fecha).toLocaleDateString('es-AR', { weekday: 'long' });

        return `
        <tr class="hover:bg-gray-50 transition-colors ${claseSemana}" 
            data-fecha="${item.fecha}" 
            data-turno="${item.turno}">
            <td class="p-3 font-semibold text-gray-700">
                <span class="capitalize">${diaNombre}</span> 
                <span class="text-xs text-gray-400 ml-2">${item.turno}</span>
            </td>
            <td class="p-3 editable-cell encounter-cell italic text-gray-400 focus:text-gray-800 focus:not-italic" 
                contenteditable="true" 
                data-placeholder="Casa de..."></td>
            <td class="p-3 text-center">
                <input type="number" 
                       value="${item.numero}" 
                       class="w-16 text-center font-bold text-green-700 text-lg bg-green-50 rounded border border-transparent focus:border-green-500 territory-input" />
            </td>
            <td class="p-3">
                <input type="text" list="listaConductores" 
                       class="w-full bg-transparent border-b border-gray-100 focus:border-green-500 outline-none" 
                       placeholder="Nombre..." />
            </td>
        </tr>`;
    },


    agruparPorSemana(plan) {
        if (!plan || plan.length === 0) return {};
        
        const semanas = {};
        
        plan.forEach(item => {
            // Normalizamos la fecha del item para encontrar su lunes
            const [y, m, d] = item.fecha.split('-').map(Number);
            const fecha = new Date(y, m - 1, d);
            const diaSemana = fecha.getDay(); 
            const diff = (diaSemana === 0 ? -6 : 1 - diaSemana);
            
            const lunesObj = new Date(fecha);
            lunesObj.setDate(fecha.getDate() + diff);
            
            const semanaKey = `${lunesObj.getFullYear()}-${String(lunesObj.getMonth() + 1).padStart(2, '0')}-${String(lunesObj.getDate()).padStart(2, '0')}`;

            if (!semanas[semanaKey]) semanas[semanaKey] = [];
            semanas[semanaKey].push(item);
        });

        // Ordenamos los items dentro de cada semana por fecha y turno
        Object.keys(semanas).forEach(key => {
            semanas[key].sort((a, b) => {
                if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
                return a.turno === "AM" ? -1 : 1;
            });
        });

        return semanas;
    }
};