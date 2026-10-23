import { Modals } from "./modals.js";
import { UIManager } from "./ui.js";
import { Controller } from "../controller/dashboard.controller.js";

// ==========================================
// MANEJADORES DE EVENTOS INDEPENDIENTES
// ==========================================

function handleLogout() {
  localStorage.removeItem("token");
  window.location.href = "../login/index.html";
}

async function handleNavegacion(btnNav) {
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

  // 💡 NUEVO: Si hacen clic en el botón de planillas, inicializamos el árbol
  if (btnNav.id === "btnPlanillas") {
    try {
      await Controller.initPlanillas();
    } catch (err) {
      console.error("Error al cargar planillas:", err);
    }
  }

  if (btnNav.id === "btnReportesSemanales") {
    try {
      await Controller.initReporteSemanal();
    } catch (err) {
      console.error("Error al cargar reportes semanales:", err);
    }
  }
}

async function handleGenerarPropuesta() {
  const fecha = document.getElementById("fechaInicioAgenda")?.value;
  if (!fecha) return alert("Seleccioná una fecha de inicio");

  UIManager.showLoading(true);
  try {
    await Controller.generarPropuesta(fecha);
  } catch (err) {
    alert("Error al generar propuesta");
  } finally {
    UIManager.showLoading(false);
  }
}

async function handleConfirmarAgenda() {
  try {
    await Controller.confirmarAgenda();
  } catch (err) {
    console.error("Error en la confirmación:", err);
  }
}

async function handleBuscarSugerencias() {
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
}

async function handleConsultarTerritorio() {
  const num = document.getElementById("territorioInput")?.value;
  if (!num) return;
  UIManager.showLoading(true);
  try {
    await Controller.consultarTerritorio(num);
  } finally {
    UIManager.showLoading(false);
  }
}

function handleModals(target) {
  // 1. Si el clic se hizo en el botón de editar de la fila
  const btnEdit = target.closest(".btn-row-edit");
  if (btnEdit) {
    Modals.abrirEdicion(btnEdit.dataset);
    return true;
  }

  // 2. Si el clic ocurrió DENTRO de la caja de contenido del modal
  if (target.closest(".modal-box") || target.closest(".modal-content")) {
    return false;
  }

  // 3. Si el usuario hace clic en cancelar o en el fondo del modal
  if (
    target.closest("#btnCancelEdit, #btnCancelDelete") ||
    target.classList.contains("modal-overlay")
  ) {
    Modals.cerrarEdicion();
    Modals.cerrarConfirmar();
    return true;
  }

  return false;
}

// Handler para agregar una nueva asignación
async function handleAsignacionSubmit(e) {
  e.preventDefault();

  const conductorNombre = document.getElementById("conductor").value.trim();
  const fechaAsig = document.getElementById("fechaAsignado").value;
  const fechaCompRaw = document.getElementById("fechaCompletado").value;
  const totalAbarcadoRaw = document.getElementById("totalAbarcado").value;

  if (!conductorNombre) {
    alert("El nombre del conductor es obligatorio.");
    return;
  }

  if (!fechaAsig) {
    alert("La fecha de asignación es obligatoria.");
    return;
  }

  const fechaCompletado =
    fechaCompRaw && fechaCompRaw.trim() !== "" ? fechaCompRaw : null;
  const cantidadAbarcado =
    totalAbarcadoRaw && totalAbarcadoRaw.trim() !== ""
      ? totalAbarcadoRaw.trim()
      : "Completo";

  const formData = {
    numero_territorio: parseInt(
      document.getElementById("numeroTerritorio").value,
      10,
    ),
    conductor: conductorNombre,
    fecha_asignado: fechaAsig,
    fecha_completado: fechaCompletado,
    cantidad_abarcado: cantidadAbarcado,
  };

  UIManager.showLoading(true);
  try {
    await Controller.crearAsignacion(formData, () => {
      e.target.reset();
    });
  } catch (err) {
    console.error("❌ Error al crear asignación:", err);
  } finally {
    UIManager.showLoading(false);
  }
}

// Handler para procesar los cambios editados del modal
async function handleAsignacionEditSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("editId").value;
  const conductorNombre = document.getElementById("editConductor").value.trim();
  const fechaAsig = document.getElementById("editFechaAsignado").value;
  const fechaCompRaw = document.getElementById("editFechaCompletado").value;
  const totalAbarcadoRaw = document.getElementById("editCantidad").value;
  const numeroTerritorio =
    document.getElementById("editTerritorio")?.value || "0";

  if (!conductorNombre) {
    alert("El nombre del conductor es obligatorio.");
    return;
  }

  if (!fechaAsig) {
    alert("La fecha de asignación es obligatoria.");
    return;
  }

  const fechaCompletado =
    fechaCompRaw && fechaCompRaw.trim() !== "" ? fechaCompRaw : null;
  const cantidadAbarcado =
    totalAbarcadoRaw && totalAbarcadoRaw.trim() !== ""
      ? totalAbarcadoRaw.trim()
      : "Completo";

  const datosActualizados = {
    numero_territorio: parseInt(numeroTerritorio, 10),
    conductor: conductorNombre,
    fecha_asignado: fechaAsig,
    fecha_completado: fechaCompletado,
    cantidad_abarcado: cantidadAbarcado,
  };

  UIManager.showLoading(true);
  try {
    await Controller.editarAsignacion(id, datosActualizados, () => {
      Modals.cerrarEdicion();
    });
  } catch (err) {
    console.error("❌ Error en la cadena de actualización:", err);
  } finally {
    UIManager.showLoading(false);
  }
}

// ==========================================
// ORQUESTADOR PRINCIPAL
// ==========================================

export function initGlobalEvents() {
  console.log("🚀 Orquestador de eventos inicializado (Modular)");

  document.addEventListener("click", async (e) => {
    const target = e.target;

    if (target.closest("#btnLogout")) return handleLogout();

    if (handleModals(target)) return;

    const btnNav = target.closest(".nav-btn");
    if (btnNav) {
      if (
        btnNav.classList.contains("btn-row-edit") ||
        btnNav.id?.includes("Edit")
      ) {
        return;
      }
      return await handleNavegacion(btnNav);
    }

    if (target.closest("#btnGenerarPropuesta"))
      return await handleGenerarPropuesta();
    if (target.closest("#btnConfirmarAgenda"))
      return await handleConfirmarAgenda();
    if (target.closest("#btnBuscarSugerencias"))
      return await handleBuscarSugerencias();
    if (target.closest("#consultarBtn"))
      return await handleConsultarTerritorio();
    if (target.closest("#btnVolverPlanillas")) {
      Controller.volverNivelPlanillas();
      return;
    }

    // 💡 Delegación de eventos para el árbol de planillas
    const cardZona = target.closest(".card-zona");
    if (cardZona) {
      const zona = parseInt(cardZona.dataset.zona, 10);
      Controller.seleccionarZonaPlanillas(zona);
      return;
    }

    const cardAnio = target.closest(".card-anio");
    if (cardAnio) {
      const anio = parseInt(cardAnio.dataset.anio, 10);
      Controller.seleccionarAnioPlanillas(anio);
      return;
    }

    const cardPlanilla = target.closest(".card-planilla");
    if (cardPlanilla) {
      const spreadsheetId = cardPlanilla.dataset.spreadsheet;
      Controller.abrirGoogleSheet(spreadsheetId);
      return;
    }
  }); // 👈 FALTABA CERRAR ESTE PARÉNTESIS Y LLAVE DEL addEventListener

  // Lógica dinámica de fechas
  document.addEventListener("change", (e) => {
    if (e.target.id === "fechaAsignado") {
      UIManager.actualizarDiasSemanaLaboral(e.target.value);
    }
  });

  // Evento de Formulario de Creación
  const formAgregar = document.getElementById("asignacionForm");
  if (formAgregar) {
    formAgregar.onsubmit = handleAsignacionSubmit;
  }

  // Vinculamos el formulario del modal de edición
  const formEditar = document.getElementById("editAsignacionForm");
  if (formEditar) {
    formEditar.onsubmit = handleAsignacionEditSubmit;
  } else {
    const formEditarAlternativo = document.querySelector("#modalEdicion form");
    if (formEditarAlternativo) {
      formEditarAlternativo.onsubmit = handleAsignacionEditSubmit;
    }
  }
}
