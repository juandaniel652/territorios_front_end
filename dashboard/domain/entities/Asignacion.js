// domain/entities/Asignacion.js
export class Asignacion {
    constructor({ numero_territorio, conductor, fecha_asignado, fecha_completado, total_abarcado }) {
        this.numero_territorio = numero_territorio;
        this.conductor         = conductor;
        this.fecha_asignado    = fecha_asignado;
        this.fecha_completado  = fecha_completado;
        this.total_abarcado    = total_abarcado;
    }
}
