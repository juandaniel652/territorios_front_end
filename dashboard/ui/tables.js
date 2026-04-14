import { DateFormatter } from "./utils.js";

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

    // Agregá esto a tu objeto export const Tables = { ... }

    renderVistaPreviaAgenda(plan, onConfirmar) {
        const container = document.getElementById("containerPropuesta");
        if (!container) return;

        const filas = plan.map(item => {
            const esAM = item.turno === "AM";
            return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="font-medium text-gray-700">${DateFormatter.toArgentina(item.fecha)}</td>
                <td>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${esAM ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}">
                        ${item.turno}
                    </span>
                </td>
                <td class="text-green-700 font-bold">T-${item.numero}</td>
                <td class="text-gray-500 text-sm">${item.zona || 'Principal'}</td>
            </tr>`;
        }).join("");

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="table w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="text-gray-600">Fecha</th>
                            <th class="text-gray-600">Turno</th>
                            <th class="text-gray-600">Territorio</th>
                            <th class="text-gray-600">Zona</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
            <div class="p-4 bg-gray-50 border-t flex justify-end items-center gap-4">
                <p class="text-xs text-gray-500">Al confirmar, se crearán ${plan.length} asignaciones automáticamente.</p>
                <button id="btnConfirmarAgendaFinal" class="btn btn-success text-white shadow-lg">
                    Confirmar e Impactar DB
                </button>
            </div>
        `;

        // Evento para el botón de confirmar que creamos dinámicamente
        document.getElementById("btnConfirmarAgendaFinal").onclick = onConfirmar;
    }
};