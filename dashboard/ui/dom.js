// ui/dom.js
export const DOM = {
    consultarBtn:         document.getElementById("consultarBtn"),
    territorioInput:      document.getElementById("territorioInput"),
    resultadoDiv:         document.getElementById("resultadoTerritorio"),
    form:                 document.getElementById("asignacionForm"),
    mensaje:              document.getElementById("mensaje"),
    inputs: {
        numeroTerritorio: document.getElementById("numero_territorio"),
        conductor:        document.getElementById("conductor"),
        fechaAsignado:    document.getElementById("fecha_asignado"),
        fechaCompletado:  document.getElementById("fecha_completado"),
        totalAbarcado:    document.getElementById("total_abarcado"),
    },
    btnBuscarSugerencias: document.getElementById("btnBuscarSugerencias"),
    rangoSelect:          document.getElementById("rangoSelect"),
    resultadoSugerencias: document.getElementById("resultadoSugerencias"),

    mostrarSeccion(id) {
        document.querySelectorAll("main section").forEach(sec => {
            sec.classList.add("hidden");
            sec.classList.remove("animate-in");
        });
        const activa = document.getElementById(id);
        activa.classList.remove("hidden");
        void activa.offsetWidth;
        activa.classList.add("animate-in");
    }
};
