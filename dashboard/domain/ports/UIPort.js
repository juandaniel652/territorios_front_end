// domain/ports/UIPort.js
// Contrato que la capa de aplicación usa para comunicarse con la UI.
export class UIPort {
    renderAsignaciones(numero, asignaciones) { throw new Error("No implementado"); }
    renderSugerencias(sugerencias)           { throw new Error("No implementado"); }
    renderGraficoSugerencias(sugerencias)    { throw new Error("No implementado"); }
    mostrarMensaje(texto, tipo)              { throw new Error("No implementado"); }
    mostrarErrorResultados(texto)            { throw new Error("No implementado"); }
    limpiarResultados()                      { throw new Error("No implementado"); }
}
