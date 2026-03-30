// domain/entities/Territorio.js
export class Territorio {
    constructor({ numero, asignaciones = [] }) {
        this.numero       = numero;
        this.asignaciones = asignaciones;
    }

    get ultimaAsignacion() { return this.asignaciones.at(-1) ?? null; }
    get totalAsignaciones() { return this.asignaciones.length; }
}
