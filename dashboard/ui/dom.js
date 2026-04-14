export const DOM = {
    // Botones y Navegación
    consultarBtn:         document.getElementById("consultarBtn"),
    btnBuscarSugerencias: document.getElementById("btnBuscarSugerencias"),
    btnLogout:            document.getElementById("btnLogout"),
    
    // Contenedores
    resultadoDiv:         document.getElementById("resultadoTerritorio"),
    resultadoSugerencias: document.getElementById("resultadoSugerencias"),
    mensaje:              document.getElementById("mensaje"),
    
    // Formulario Principal (Agregamos el objeto inputs que falta)
    territorioInput:      document.getElementById("territorioInput"),
    rangoSelect:          document.getElementById("rangoSelect"),
    form:                 document.getElementById("asignacionForm"),
    
    // --- ESTO ES LO QUE ESTABA FALTANDO ---
    inputs: {
        numeroTerritorio: document.getElementById("numeroTerritorio"),
        conductor:        document.getElementById("conductor"),
        fechaAsignado:    document.getElementById("fechaAsignado"),
        fechaCompletado:  document.getElementById("fechaCompletado"),
        totalAbarcado:    document.getElementById("totalAbarcado")
    },

    // Modal Edición
    modalEdicion:         document.getElementById("modalEdicion"),
    formEdicion:          document.getElementById("formEdicion"),
    editInputs: {
        id:               document.getElementById("editId"),
        conductor:        document.getElementById("editConductor"),
        fechaAsignado:    document.getElementById("editFechaAsignado"),
        fechaCompletado:  document.getElementById("editFechaCompletado"),
        cantidad:         document.getElementById("editCantidad"),
    },

    // Modal Confirmación
    modalConfirm:         document.getElementById("modalConfirm"),
    confirmDeleteId:      document.getElementById("confirmDeleteId"),
    btnConfirmDelete:     document.getElementById("btnConfirmDelete"),

    btnAgenda:            document.getElementById("btnAgenda"), // El botón del sidebar
    btnGenerarPropuesta:  document.getElementById("btnGenerarPropuesta"),
    fechaInicioAgenda:    document.getElementById("fechaInicioAgenda"),
    containerPropuesta:   document.getElementById("containerPropuesta"),

    // Gráficos
    canvasAsignaciones:   "asignacionesChart",

    mostrarSeccion(id) {
        document.querySelectorAll("main section").forEach(sec => {
            sec.classList.add("hidden");
            sec.classList.remove("animate-in");
        });
        const activa = document.getElementById(id);
        if (activa) {
            activa.classList.remove("hidden");
            void activa.offsetWidth;
            activa.classList.add("animate-in");
        }
    }
};
