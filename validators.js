// ===============================
// validators.js (reglas de negocio simples)
// ===============================
export const Validators = {
  territorioValido(numero) {
    return numero && !isNaN(numero);
  },

  asignacionCompleta(a) {
    return (
      a.numero_territorio &&
      a.conductor &&
      a.fecha_asignado &&
      a.fecha_completado &&
      a.total_abarcado
    );
  }
};