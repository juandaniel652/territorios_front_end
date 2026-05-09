import { Modals } from "./modals.js";
import { UIManager } from "./ui.js";
import { Controller } from "../controller/dashboard.controller.js";

export function initGlobalEvents() {
    console.log("🚀 Orquestador de eventos inicializado");

    document.addEventListener("click", async (e) => {
        const target = e.target;

        // --- 1. LOGOUT ---
        if (target.closest("#btnLogout")) {
            localStorage.removeItem("token");
            window.location.href = "../login/index.html";
            return;
        }

        // --- 2. NAVEGACIÓN CANÓNICA ---
        const btnNav = target.closest(".nav-btn");
        if (btnNav) {
            UIManager.cambiarSeccion(btnNav.id); 

            if (btnNav.id === "btnAgenda") {
                UIManager.showLoading(true);
                try {
                    await Controller.cargarDashboardCompleto("1-20");
                } catch (err) {
                    console.error("Error al cargar agenda:", err);
                } finally {
                    UIManager.showLoading(false);
                }
            }
            return;
        }

        // --- 3. ACCIONES DE AGENDA (GENERAR) ---
        if (target.closest("#btnGenerarPropuesta")) {
            const fecha = document.getElementById("fechaInicioAgenda")?.value;
            if (!fecha) return alert("Seleccioná una fecha de inicio");

            UIManager.showLoading(true);
            try {
                // Sincronizado con Controller.generarPropuesta
                await Controller.generarPropuesta(fecha);
            } catch (err) {
                alert("Error al generar propuesta");
            } finally {
                UIManager.showLoading(false);
            }
            return;
        }

        // --- 4. ACCIONES DE AGENDA (CONFIRMAR) ---
        if (target.closest("#btnConfirmarAgenda")) {
            // Nota: El botón está dentro del HTML generado por Tables.js, 
            // este listener global lo capturará perfectamente.
            try {
                // Sincronizado con Controller.confirmarAgenda
                await Controller.confirmarAgenda();
            } catch (err) {
                console.error("Error en la confirmación:", err);
            }
            return;
        }

        // --- 5. BUSCADOR DE SUGERENCIAS ---
        if (target.closest("#btnBuscarSugerencias")) {
            const select = document.getElementById("rangoSelect");
            const rango = select?.value;
            if (!rango) return;
        
            UIManager.showLoading(true);
            try {
                await Controller.obtenerSugerencias(rango);
            } catch (err) {
                console.error("Error al buscar sugerencias:", err);
            } finally {
                UIManager.showLoading(false);
            }
            return;
        }

        // --- 6. CONSULTAR TERRITORIO ---
        if (target.closest("#consultarBtn")) {
            const num = document.getElementById("territorioInput")?.value;
            if (!num) return;
            UIManager.showLoading(true);
            try {
                await Controller.consultarTerritorio(num);
            } finally {
                UIManager.showLoading(false);
            }
            return;
        }

        // --- 7. GESTIÓN DE MODALES ---
        const btnEdit = target.closest(".btn-row-edit");
        if (btnEdit) {
            Modals.abrirEdicion(btnEdit.dataset);
            return;
        }

        if (target.closest("#btnCancelEdit, #btnCancelDelete, .modal-overlay")) {
            Modals.cerrarEdicion();
            Modals.cerrarConfirmar();
            return;
        }
    });

    // --- 8. LÓGICA DINÁMICA DE FECHAS (NUEVO) ---
    document.addEventListener("change", (e) => {
        if (e.target.id === "fechaAsignado") {
            UIManager.actualizarDiasSemanaLaboral(e.target.value);
        }
    });

    // --- 9. FORMULARIO AGREGAR ASIGNACIÓN ---
    const formAgregar = document.getElementById("asignacionForm");
    if (formAgregar) {
        formAgregar.onsubmit = async (e) => {
            e.preventDefault();
            
            // Capturamos valores para validar antes de enviar
            const conductorNombre = document.getElementById("conductor").value.trim();
            const fechaAsig = document.getElementById("fechaAsignado").value;

            // Validación simple en el front para evitar viajes innecesarios
            if (!conductorNombre) {
                alert("El nombre del conductor es obligatorio.");
                return;
            }

            const formData = {
                // 1. CLAVE: Debe ser numero_territorio (como en tu schema.py)
                numero_territorio: parseInt(document.getElementById("numeroTerritorio").value),
                // 2. Conductor ya limpio con trim()
                conductor: conductorNombre,
                // 3. Formato YYYY-MM-DD (el input type="date" ya lo da así)
                fecha_asignado: fechaAsig,
                // 4. Si está vacío, null (que Pydantic lo toma como None)
                fecha_completado: document.getElementById("fechaCompletado").value || null,
                // 5. Valor por defecto si no hay nada
                cantidad_abarcado: document.getElementById("totalAbarcado").value || "Completo"
            };

            console.log("📤 Enviando a FastAPI:", formData);

            UIManager.showLoading(true);
            try {
                await Controller.crearAsignacion(formData);
                formAgregar.reset();
                UIManager.mostrarMensaje("✅ Asignación creada con éxito", "success");
            } catch (err) {
                console.error("❌ Error en la creación:", err);
                // Si el backend lanza el ValueError del validator, lo verás acá
                alert("Error al guardar: " + err.message);
            } finally {
                UIManager.showLoading(false);
            }
        };
    }
}