// domain/entities/Territorio.js
import { Asignacion } from "./Asignacion.js";

export class Territorio {
    constructor({ numero, asignaciones = [] }) {
        this.numero       = numero;
        this.asignaciones = asignaciones.map(a => new Asignacion(a));
    }

    get ultimaAsignacion() { return this.asignaciones.at(-1) ?? null; }
    get totalAsignaciones() { return this.asignaciones.length; }
}
