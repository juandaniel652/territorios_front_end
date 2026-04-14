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


   renderVistaPreviaAgenda(plan) {
        const container = document.getElementById("containerPropuesta");
        if (!container) return;

        // 1. Obtenemos la fecha de inicio real (el lunes del primer item)
        // Esto asegura que la UI pinte desde el lunes aunque el plan empiece otro día
        const semanas = this.agruparPorSemana(plan);

        let html = `<div class="agenda-container shadow-xl rounded-lg overflow-hidden border border-gray-200">`;

        Object.keys(semanas).forEach(lunesKey => {
            const items = semanas[lunesKey];
            
            // Creamos el objeto fecha para el título de la semana
            const [y, m, d] = lunesKey.split('-').map(Number);
            const inicio = new Date(y, m - 1, d);
            const fin = new Date(inicio);
            fin.setDate(fin.getDate() + 6);

            const rangoTexto = `Semana del ${inicio.getDate()} de ${inicio.toLocaleString('es-AR', {month: 'long'})} al ${fin.getDate()} de ${fin.toLocaleString('es-AR', {month: 'long'})} de ${fin.getFullYear()}`;

            html += `
                <div class="semana-header bg-green-700 text-white px-4 py-2 font-bold text-center uppercase tracking-wider">
                    ${rangoTexto}
                </div>
                <table class="w-full text-sm text-left border-collapse bg-white">
                    <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
                        <tr>
                            <th class="p-3 border-b">Día y Horario</th>
                            <th class="p-3 border-b">Encuentro</th>
                            <th class="p-3 border-b text-center">Territorio</th>
                            <th class="p-3 border-b">Conductor</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${items.map(item => {
                            // Formateo de día (Lunes, Martes...)
                            const [iy, im, id] = item.fecha.split('-').map(Number);
                            const fechaObj = new Date(iy, im - 1, id);
                            const diaNombre = fechaObj.toLocaleString('es-AR', {weekday: 'long'});
                            const horaSugerida = item.turno === "AM" ? "09:30hs" : "16:30hs";

                            return `
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="p-3 font-semibold text-gray-700">
                                    <span class="capitalize">${diaNombre}</span> 
                                    <span class="text-gray-400 font-normal ml-2">${horaSugerida}</span>
                                </td>
                                <td class="p-3 text-gray-800 italic border-x bg-yellow-50/30" contenteditable="true">Sugerir casa...</td>
                                <td class="p-3 text-center font-bold text-green-700 text-lg">${item.numero}</td>
                                <td class="p-3 text-gray-800 italic bg-yellow-50/30" contenteditable="true">Asignar conductor...</td>
                            </tr>`;
                        }).join("")}
                    </tbody>
                </table>
            `;
        });

        html += `</div>
            <div class="mt-6 flex justify-end p-4">
                 <button id="btnConfirmarAgendaFinal" class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all transform hover:scale-105">
                    Confirmar y Guardar Agenda
                 </button>
            </div>`;

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