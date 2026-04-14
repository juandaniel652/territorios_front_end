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


   renderVistaPreviaAgenda(plan, conductoresConocidos = []) {
        const container = document.getElementById("containerPropuesta");
        if (!container) return;
    
        const listaConductores = Array.isArray(conductoresConocidos) ? conductoresConocidos : [];
    
        const datalistHTML = `
            <datalist id="listaConductores">
                ${listaConductores.map(c => {
                    const nombre = (typeof c === 'object') ? (c.nombre_completo || c.nombre) : c;
                    return `<option value="${nombre}">`;
                }).join("")}
            </datalist>
        `;
            
        if (!Array.isArray(plan)) {
            container.innerHTML = "<p class='text-red-500'>Error: El formato del plan es inválido.</p>";
            return;
        }
    
        const semanas = this.agruparPorSemana(plan);
        let html = datalistHTML + `<div class="agenda-container space-y-8">`;
    
        Object.keys(semanas).forEach(lunesKey => {
            const items = semanas[lunesKey];
            html += `
                <div class="shadow-xl rounded-lg overflow-hidden border border-gray-200">
                    <div class="bg-green-700 text-white p-4 font-bold">Semana del ${lunesKey}</div>
                    <table class="w-full text-sm text-left border-collapse bg-white">
                        <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
                            <tr>
                                <th class="p-3 border-b" style="width: 25%">Día y Horario</th>
                                <th class="p-3 border-b" style="width: 30%">Encuentro (Lugar)</th>
                                <th class="p-3 border-b text-center" style="width: 15%">Territorio</th>
                                <th class="p-3 border-b" style="width: 30%">Conductor</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            ${items.map(item => {
                                const [iy, im, id] = item.fecha.split('-').map(Number);
                                const fechaObj = new Date(iy, im - 1, id);
                                const diaNombre = fechaObj.toLocaleString('es-AR', {weekday: 'long'});
                                const horaSugerida = item.turno === "AM" ? "09:30hs" : "16:30hs";
                                return `
                                <tr class="hover:bg-gray-50 transition-colors" data-fecha="${item.fecha}" data-id-territorio="${item.territorio_id}" data-turno="${item.turno}">
                                    <td class="p-3 font-semibold text-gray-700">
                                        <span class="capitalize">${diaNombre}</span> 
                                        <span class="text-gray-400 font-normal ml-2">${horaSugerida}</span>
                                    </td>
                                    <td class="p-3 editable-cell encounter-cell italic text-gray-400 focus:text-gray-800 focus:not-italic" 
                                        contenteditable="true" 
                                        data-placeholder="Ej: Casa de Juan..."></td>
                                    <td class="p-3 text-center font-bold text-green-700 text-lg">${item.numero}</td>
                                    <td class="p-3">
                                        <input type="text" list="listaConductores" 
                                               class="w-full bg-transparent border-none focus:ring-0 italic text-gray-400 focus:text-gray-800 focus:not-italic" 
                                               placeholder="Asignar conductor..." />
                                    </td>
                                </tr>`;
                            }).join("")}
                        </tbody>
                    </table>
                </div>`;
        });
    
        // --- EL BOTÓN QUE FALTABA ---
        html += `
            <div class="mt-8 flex justify-end p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <button id="btnConfirmarAgendaFinal" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Confirmar y Guardar Agenda
                </button>
            </div>
        </div>`;
    
        container.innerHTML = html;
    
        // Asignar el evento al botón recién creado
        setTimeout(() => {
            const btn = document.getElementById("btnConfirmarAgendaFinal");
            if (btn) btn.onclick = () => UI.manejarConfirmarAgenda();
        }, 0);
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