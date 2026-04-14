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
    renderVistaPreviaAgenda(plan, onConfirmar) {
        const container = document.getElementById("containerPropuesta");
        if (!container) return;
    
        const semanas = agruparPorSemana(plan);
        let html = `<div class="agenda-container shadow-xl rounded-lg overflow-hidden border border-gray-200">`;
    
        Object.keys(semanas).forEach(lunesKey => {
            const items = semanas[lunesKey];
            const inicio = new Date(lunesKey + "T00:00:00");
            const fin = new Date(inicio);
            fin.setDate(fin.getDate() + 6);
        
            // Formateador de rango: "Del 27 de Abril al 03 de Mayo de 2026"
            const rangoTexto = `Semana del ${inicio.getDate()} de ${inicio.toLocaleString('es-AR', {month: 'long'})} al ${fin.getDate()} de ${fin.toLocaleString('es-AR', {month: 'long'})} de ${fin.getFullYear()}`;
        
            html += `
                <div class="semana-header bg-green-700 text-white px-4 py-2 font-bold text-center uppercase tracking-wider">
                    ${rangoTexto}
                </div>
                <table class="w-full text-sm text-left border-collapse">
                    <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
                        <tr>
                            <th class="p-3 border-b w-1/4">Horarios (Día/Hora)</th>
                            <th class="p-3 border-b w-1/4">Encuentro</th>
                            <th class="p-3 border-b w-1/4 text-center">Territorio</th>
                            <th class="p-3 border-b w-1/4">Conductor</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${items.map(item => {
                            const diaNombre = new Date(item.fecha + "T00:00:00").toLocaleString('es-AR', {weekday: 'long'});
                            const horaSugerida = item.turno === "AM" ? "09:30hs" : "16:30hs";
                            return `
                            <tr class="hover:bg-gray-50 transition-colors bg-white">
                                <td class="p-3 font-semibold text-gray-700">
                                    <span class="capitalize">${diaNombre}</span> 
                                    <span class="text-gray-400 font-normal ml-2">${horaSugerida}</span>
                                </td>
                                <td class="p-3 text-gray-400 italic">—</td>
                                <td class="p-3 text-center font-bold text-green-700">${item.numero}</td>
                                <td class="p-3 text-gray-400 italic">—</td>
                            </tr>`;
                        }).join("")}
                    </tbody>
                </table>
            `;
        });
    
        html += `</div>
            <div class="mt-6 flex justify-end p-4 bg-gray-50 rounded-b-lg">
                 <button id="btnConfirmarAgendaFinal" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold shadow-md transition-all">
                    Confirmar Agenda Profesional
                 </button>
            </div>`;
    
        container.innerHTML = html;
        document.getElementById("btnConfirmarAgendaFinal").onclick = onConfirmar;
    }
};