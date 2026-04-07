// domain/entities/Asignacion.js
export class Asignacion {
    constructor({ id, numero_territorio, conductor, fecha_asignado, fecha_completado, cantidad_abarcado }) {
        this.id               = id ?? null;
        this.numero_territorio = numero_territorio;
        this.conductor         = conductor;
        this.fecha_asignado    = fecha_asignado;
        this.fecha_completado  = fecha_completado;
        this.cantidad_abarcado = cantidad_abarcado ?? null;
    }
}

