// domain/ports/AsignacionRepository.js
// Contrato que define las operaciones disponibles.
// api.js lo implementa. El dominio nunca sabe que existe fetch.
export class AsignacionRepository {
    async getTerritorio(numero)       { throw new Error("getTerritorio() no implementado"); }
    async crearAsignacion(asignacion) { throw new Error("crearAsignacion() no implementado"); }
    async getSugerencias(rango)       { throw new Error("getSugerencias() no implementado"); }
}
