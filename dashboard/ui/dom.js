// ui/dom.js
export const DOM = {
    // Botones y Navegación
    consultarBtn:         document.getElementById("consultarBtn"),
    btnBuscarSugerencias: document.getElementById("btnBuscarSugerencias"),
    btnLogout:            document.getElementById("btnLogout"),
    
    // Contenedores
    resultadoDiv:         document.getElementById("resultadoTerritorio"),
    resultadoSugerencias: document.getElementById("resultadoSugerencias"),
    mensaje:              document.getElementById("mensaje"),
    
    // Inputs Formulario Principal
    territorioInput:      document.getElementById("territorioInput"),
    rangoSelect:          document.getElementById("rangoSelect"),
    formAsignacion:       document.getElementById("asignacionForm"),
    
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

    // Gráficos
    canvasAsignaciones:   "asignacionesChart", // Solo el ID para Chart.js

    mostrarSeccion(id) {
        document.querySelectorAll("main section").forEach(sec => {
            sec.classList.add("hidden");
            sec.classList.remove("animate-in");
        });
        const activa = document.getElementById(id);
        if (activa) {
            activa.classList.remove("hidden");
            void activa.offsetWidth; // Force reflow para la animación
            activa.classList.add("animate-in");
        }
    }
};