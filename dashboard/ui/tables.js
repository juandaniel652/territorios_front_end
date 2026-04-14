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


   renderVistaPreviaAgenda(plan, conductoresConocidos) {
        const container = document.getElementById("containerPropuesta");
        if (!container) return;
    
        // --- EL FIX AQUÍ ---
        // Si conductoresConocidos es null, undefined o no es un Array, usamos []
        const listaConductores = Array.isArray(conductoresConocidos) ? conductoresConocidos : [];
    
        const datalistHTML = `
            <datalist id="listaConductores">
                ${listaConductores.map(c => {
                    // Si c es un objeto usamos c.nombre_completo, si es un string usamos c
                    const nombre = (typeof c === 'object') ? (c.nombre_completo || c.nombre) : c;
                    return `<option value="${nombre}">`;
                }).join("")}
            </datalist>
        `;
            
        if (!Array.isArray(plan)) {
            console.error("❌ El plan no es un array:", plan);
            container.innerHTML = "<p class='text-red-500'>Error: El formato del plan es inválido.</p>";
            return;
        }
    
        const semanas = this.agruparPorSemana(plan);
        let html = datalistHTML + `<div class="agenda-container shadow-xl rounded-lg overflow-hidden border border-gray-200">`;

        Object.keys(semanas).forEach(lunesKey => {
            const items = semanas[lunesKey];
            // ... (lógica de encabezado de semana igual a la anterior) ...

            html += `
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
                                    <input type="text" 
                                           list="listaConductores" 
                                           class="w-full bg-transparent border-none focus:ring-0 italic text-gray-400 focus:text-gray-800 focus:not-italic" 
                                           placeholder="Asignar conductor..." />
                                </td>
                            </tr>`;
                        }).join("")}
                    </tbody>
                </table>`;
        });

        html += `</div>... (botón de confirmar) ...`;
        container.innerHTML = html;
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