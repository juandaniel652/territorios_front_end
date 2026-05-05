// dashboard/ui/dom.js

/**
 * DOM Manager - Centraliza el acceso a los elementos de la interfaz.
 * Usamos 'getters' para asegurar que los elementos se busquen en el momento de uso,
 * evitando errores de 'null' durante la carga inicial o el build de Vite.
 */
export const DOM = {
    // --- BOTONES Y NAVEGACIÓN ---
    get consultarBtn()         { return document.getElementById("consultarBtn"); },
    get btnBuscarSugerencias() { return document.getElementById("btnBuscarSugerencias"); },
    get btnLogout()            { return document.getElementById("btnLogout"); },
    get btnAgenda()            { return document.getElementById("btnAgenda"); },
    get btnGenerarPropuesta()  { return document.getElementById("btnGenerarPropuesta"); },

    // --- CONTENEDORES Y MENSAJES ---
    get resultadoDiv()         { return document.getElementById("resultadoTerritorio"); },
    get resultadoSugerencias() { return document.getElementById("resultadoSugerencias"); },
    get mensaje()              { return document.getElementById("mensaje"); },
    get containerPropuesta()   { return document.getElementById("containerPropuesta"); },
    get mainLoader()           { return document.getElementById("mainLoader"); },

    // --- FORMULARIO PRINCIPAL ---
    get territorioInput()      { return document.getElementById("territorioInput"); },
    get rangoSelect()          { return document.getElementById("rangoSelect"); },
    get form()                 { return document.getElementById("asignacionForm"); },
    get fechaInicioAgenda()    { return document.getElementById("fechaInicioAgenda"); },

    // --- INPUTS DE CREACIÓN (Agrupados) ---
    inputs: {
        get numeroTerritorio() { return document.getElementById("numeroTerritorio"); },
        get conductor()        { return document.getElementById("conductor"); },
        get fechaAsignado()    { return document.getElementById("fechaAsignado"); },
        get fechaCompletado()  { return document.getElementById("fechaCompletado"); },
        get totalAbarcado()    { return document.getElementById("totalAbarcado"); }
    },

    // --- MODAL EDICIÓN ---
    get modalEdicion()         { return document.getElementById("modalEdicion"); },
    get formEdicion()          { return document.getElementById("formEdicion"); },
    editInputs: {
        get id()               { return document.getElementById("editId"); },
        get conductor()        { return document.getElementById("editConductor"); },
        get fechaAsignado()    { return document.getElementById("editFechaAsignado"); },
        get fechaCompletado()  { return document.getElementById("editFechaCompletado"); },
        get cantidad()         { return document.getElementById("editCantidad"); }
    },

    // --- MODAL CONFIRMACIÓN / ELIMINACIÓN ---
    get modalConfirm()         { return document.getElementById("modalConfirm"); },
    get confirmDeleteId()      { return document.getElementById("confirmDeleteId"); },
    get btnConfirmDelete()     { return document.getElementById("btnConfirmDelete"); },

    // --- GRÁFICOS (Retorna el elemento, no solo el ID) ---
    get canvasAsignaciones()   { return document.getElementById("asignacionesChart"); },

    /**
     * Gestión de visibilidad de secciones
     * @param {string} id - ID de la sección a mostrar
     */
    mostrarSeccion(id) {
        const secciones = document.querySelectorAll("main section, .section-base");
        secciones.forEach(sec => {
            sec.classList.add("hidden");
            sec.classList.remove("animate-in");
        });

        const activa = document.getElementById(id);
        if (activa) {
            activa.classList.remove("hidden");
            // Force reflow para disparar la animación de CSS
            void activa.offsetWidth; 
            activa.classList.add("animate-in");
        } else {
            console.warn(`⚠️ Intento de mostrar sección inexistente: ${id}`);
        }
    }
};