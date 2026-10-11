import { DateFormatter, agruparPorSemana } from "./utils.js";

export const Tables = {
  renderAsignaciones(numero, asignaciones) {
    const container = document.getElementById("resultadoTerritorio");
    if (!container) return;

    if (!asignaciones.length || numero <= 0) {
      container.innerHTML = `<p class="result-empty">Sin asignaciones para el territorio <strong>${numero}</strong>.</p>`;
      return;
    }

    const filas = asignaciones
      .map((a) => {
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
      })
      .join("");

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
            <div class="space-y-8">
                <div class="border border-green-200 rounded-lg overflow-hidden shadow-sm bg-white">
                    <div class="bg-green-700 px-5 py-3 text-center">
                        <h3 class="text-white font-semibold tracking-wider uppercase text-xs">
                            ${this._formatearRangoSemana(semana1)}
                        </h3>
                    </div>
                    <div class="p-1">
                        ${this._generarTablaSemana(semana1, "semana-1")}
                    </div>
                </div>
        
                <div class="border border-green-200 rounded-lg overflow-hidden shadow-sm bg-white">
                    <div class="bg-green-700 px-5 py-3 text-center">
                        <h3 class="text-white font-semibold tracking-wider uppercase text-xs">
                            ${this._formatearRangoSemana(semana2)}
                        </h3>
                    </div>
                    <div class="p-1">
                        ${this._generarTablaSemana(semana2, "semana-2")}
                    </div>
                </div>
        
                <div class="flex justify-center pt-2">
                    <button id="btnConfirmarAgenda" 
                            class="bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-8 rounded-md shadow transition-colors uppercase text-xs tracking-wider">
                        Confirmar y Archivar Agenda Completa
                    </button>
                </div>
            </div>
        `;
    container.innerHTML = html;
  },

  _formatearRangoSemana(items) {
    if (!items || items.length === 0) return "";

    const parse = (dateStr) => {
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d);
    };

    const fechaInicio = parse(items[0].fecha);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaInicio.getDate() + 6);

    const opciones = { day: "numeric", month: "long" };
    const inicioStr = fechaInicio.toLocaleDateString("es-AR", opciones);
    const finStr = fechaFin.toLocaleDateString("es-AR", opciones);
    const año = fechaInicio.getFullYear();

    return `Del ${inicioStr} al ${finStr} de ${año}`;
  },

  _generarTablaSemana(items, claseSemana) {
    if (!items || items.length === 0) {
      return '<p class="p-4 text-gray-400 italic text-center">No hay registros para esta semana.</p>';
    }

    return `
        <table class="w-full text-left border-collapse">
            <thead class="bg-green-50 text-green-900 text-[11px] uppercase tracking-wider font-semibold border-b border-green-200">
                <tr>
                    <th class="p-3">Día / Turno</th>
                    <th class="p-3">Punto de Encuentro</th>
                    <th class="p-3 text-center">Territorio</th>
                    <th class="p-3">Conductor Disponible</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                ${items.map((item) => this._renderFilaAgenda(item, claseSemana)).join("")}
            </tbody>
        </table>
    `;
  },

  _renderFilaAgenda(item, claseSemana) {
    const [y, m, d] = item.fecha.split("-").map(Number);
    const fechaObj = new Date(y, m - 1, d);
    const diaNombre = fechaObj.toLocaleDateString("es-AR", { weekday: "long" });

    let opcionesConductores = `<option value="">-- Seleccionar Conductor --</option>`;
    if (
      item.conductores_disponibles &&
      Array.isArray(item.conductores_disponibles)
    ) {
      item.conductores_disponibles.forEach((c) => {
        opcionesConductores += `<option value="${c.id}" data-nombre="${c.nombre_completo}">${c.nombre_completo} (${c.sexo})</option>`;
      });
    }

    return `
        <tr class="hover:bg-green-50/40 transition-colors ${claseSemana} agenda-row" 
            data-fecha="${item.fecha}" 
            data-turno="${item.turno}"
            data-territorio-id="${item.territorio_id}"> 
            <td class="p-3">
                <span class="capitalize font-semibold text-gray-800">${diaNombre}</span> 
                <span class="text-[10px] text-green-700 font-semibold ml-1.5 bg-green-50 px-2 py-0.5 rounded border border-green-200">${item.turno}</span>
            </td>
            <td class="p-3 encounter-cell text-sm text-gray-500 italic focus:text-gray-800 focus:not-italic outline-none" 
                contenteditable="true">Salón del Reino</td>
            <td class="p-3 text-center">
                <input type="number" 
                        value="${item.numero}" 
                        class="w-12 text-center font-semibold text-green-800 bg-green-50/50 rounded border border-gray-200 focus:border-green-600 outline-none territory-input" />
            </td>
            <td class="p-3">
                <select class="select-conductor w-full bg-white text-sm border border-gray-200 rounded-md p-1.5 focus:border-green-600 outline-none text-gray-700">
                    ${opcionesConductores}
                </select>
            </td>
        </tr>`;
  },
};
