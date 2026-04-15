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

    renderVistaPreviaAgenda(plan, conductores = []) {
        const container = document.getElementById("containerPropuesta");
        if (!container) return;
        
        const semana1 = plan.slice(0, 10);
        const semana2 = plan.slice(10, 20);
        
        let html = `
            <div class="space-y-12">
                <div class="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
                    <div class="bg-white py-6 border-b border-gray-100 text-center">
                        <h3 class="text-gray-800 font-medium tracking-wide uppercase text-sm italic">
                            ${this._formatearRangoSemana(semana1)}
                        </h3>
                    </div>
                    <div class="p-1">
                        ${this._generarTablaSemana(semana1, "semana-1")}
                    </div>
                </div>
        
                <div class="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
                    <div class="bg-white py-6 border-b border-gray-100 text-center">
                        <h3 class="text-gray-800 font-medium tracking-wide uppercase text-sm italic">
                            ${this._formatearRangoSemana(semana2)}
                        </h3>
                    </div>
                    <div class="p-1">
                        ${this._generarTablaSemana(semana2, "semana-2")}
                    </div>
                </div>
        
                <div class="flex justify-center pt-6">
                    <button id="btnConfirmarAgenda" 
                            class="bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-12 rounded shadow-md transition-all duration-200 uppercase text-xs tracking-widest">
                        Confirmar y Archivar Agenda
                    </button>
                </div>
            </div>
        `;
        container.innerHTML = html;
    },
    
    _formatearRangoSemana(items) {
        if (!items || items.length === 0) return "";
        
        const parse = (dateStr) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        const fechaInicio = parse(items[0].fecha);
        // Calculamos el domingo (fin de semana) sumando los días necesarios
        // Si el inicio es lunes, el domingo es inicio + 6 días
        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaInicio.getDate() + 6);

        const opciones = { day: 'numeric', month: 'long' };
        const inicioStr = fechaInicio.toLocaleDateString('es-AR', opciones);
        const finStr = fechaFin.toLocaleDateString('es-AR', opciones);
        const año = fechaInicio.getFullYear();

        return `Del ${inicioStr} al ${finStr} de ${año}`;
    },

    _generarTablaSemana(items, claseSemana) {
        if (!items || items.length === 0) return '<p class="p-4 text-gray-400 italic text-center">No hay registros disponibles.</p>';

        return `
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-wider font-semibold">
                    <tr>
                        <th class="p-4 border-b">Día / Turno</th>
                        <th class="p-4 border-b">Punto de Encuentro</th>
                        <th class="p-4 border-b text-center">Territorio</th>
                        <th class="p-4 border-b">Conductor</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    ${items.map(item => this._renderFilaAgenda(item, claseSemana)).join('')}
                </tbody>
            </table>
        `;
    },

    _renderFilaAgenda(item, claseSemana) {
        const [y, m, d] = item.fecha.split('-').map(Number);
        const fechaObj = new Date(y, m - 1, d);
        const diaNombre = fechaObj.toLocaleDateString('es-AR', { weekday: 'long' });

        return `
        <tr class="hover:bg-gray-50/50 transition-colors ${claseSemana}" 
            data-fecha="${item.fecha}" 
            data-turno="${item.turno}">
            <td class="p-4 text-sm text-gray-600">
                <span class="capitalize font-medium text-gray-900">${diaNombre}</span> 
                <span class="text-[10px] text-gray-400 ml-1 bg-gray-100 px-1.5 py-0.5 rounded">${item.turno}</span>
            </td>
            <td class="p-4 editable-cell encounter-cell text-sm text-gray-400 italic focus:text-gray-800 focus:not-italic outline-none" 
                contenteditable="true" 
                data-placeholder="Definir encuentro..."></td>
            <td class="p-4 text-center">
                <input type="number" 
                       value="${item.numero}" 
                       class="w-12 text-center font-semibold text-green-700 bg-green-50/50 border-b border-transparent focus:border-green-500 outline-none territory-input" />
            </td>
            <td class="p-4">
                <input type="text" list="listaConductores" 
                       class="w-full bg-transparent text-sm border-b border-gray-100 focus:border-green-600 outline-none placeholder:text-gray-300" 
                       placeholder="Nombre del conductor" />
            </td>
        </tr>`;
    }
};