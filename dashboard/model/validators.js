// domain/validators.js
export const Validators = {
    territorioValido(numero) {
        return numero !== "" && numero !== null && !isNaN(numero) && Number(numero) > 0;
    },
    asignacionCompleta(a) {
        return (
            a.numero_territorio &&
            a.conductor?.trim() &&
            a.fecha_asignado &&
            a.fecha_completado &&
            a.total_abarcado?.trim()
        );
    }
};
