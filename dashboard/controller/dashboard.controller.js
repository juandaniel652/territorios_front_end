// dashboard/controller/dashboard.controller.js
import { Api } from "../model/api.service.js";
import { Validators } from "../model/validators.js";
import { UIManager } from "../ui/ui.js";
import { Charts } from "../ui/charts.js";
import { CONFIG } from "../config.js";

const API_BASE = CONFIG.BASE_URL;

export const Controller = {
  async consultarTerritorio(numero) {
    UIManager.limpiarResultados();
    if (!Validators.territorioValido(numero)) {
      UIManager.mostrarErrorResultados(
        "Ingrese un número de territorio válido.",
      );
      return;
    }
    try {
      const territorio = await Api.getTerritorio(numero);
      UIManager.renderAsignaciones(
        territorio.territorio,
        territorio.asignaciones,
      );
    } catch (error) {
      console.error("❌ Error en consulta:", error);
      UIManager.mostrarMensaje("Error al obtener datos", "error");
    }
  },

  async crearAsignacion(asignacionData, onSuccess) {
    console.log(
      "📥 Controller recibió los datos para validar:",
      asignacionData,
    );

    if (
      !asignacionData.numero_territorio ||
      !asignacionData.conductor ||
      !asignacionData.fecha_asignado
    ) {
      console.error(
        "❌ Validación fallida en Controller. Faltan propiedades críticas:",
        {
          numero_territorio: asignacionData.numero_territorio,
          conductor: asignacionData.conductor,
          fecha_asignado: asignacionData.fecha_asignado,
        },
      );
      UIManager.mostrarMensaje(
        "Faltan datos esenciales (Territorio, Conductor o Fecha).",
        "error",
      );
      return;
    }

    try {
      console.log("🚀 Disparando petición HTTP vía Api.crearAsignacion()...");
      const result = await Api.crearAsignacion(asignacionData);

      console.log("✅ Respuesta exitosa del Servidor:", result);
      UIManager.mostrarMensaje("✅ Guardado con éxito.", "success");

      if (onSuccess) {
        onSuccess();
      }

      this.cargarDashboardCompleto();
    } catch (error) {
      console.error("❌ Error atrapado en Controller.crearAsignacion:", error);
      console.dir(error);

      let mensajeError = "Error al guardar en el servidor.";
      if (error && error.detail) {
        mensajeError =
          typeof error.detail === "string"
            ? error.detail
            : JSON.stringify(error.detail);
      } else if (error && error.message) {
        mensajeError = error.message;
      }

      UIManager.mostrarMensaje(`❌ ${mensajeError}`, "error");
    }
  },

  async obtenerSugerencias(rangoSeleccionado) {
    UIManager.showLoading(true);
    try {
      const data = await Api.getSugerencias(rangoSeleccionado);
      const listaSugerida = data.sugerencias || data;

      UIManager.renderSugerencias(listaSugerida);
      this.actualizarSoloGrafico(listaSugerida);
    } catch (error) {
      console.error("❌ Error:", error);
    } finally {
      UIManager.showLoading(false);
    }
  },

  actualizarSoloGrafico(territorios) {
    if (window.Charts && window.Charts.renderBarChart) {
      const labels = territorios.map((t) => `T-${t.numero}`);
      const values = this._calcularDiasAtraso(territorios);
      window.Charts.renderBarChart(
        "asignacionesChart",
        labels,
        values,
        "#10b981",
      );
    }
  },

  _deArgentinoAISO(fechaArg) {
    if (!fechaArg) return null;
    if (fechaArg.includes("-")) return fechaArg;

    const partes = fechaArg.split("/");
    if (partes.length !== 3) return null;
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  },

  async editarAsignacion(id, campos, onSuccess) {
    try {
      console.log("📥 Datos recibidos en el Controller para edición:", campos);

      const fechaAsignadoISO = this._deArgentinoAISO(
        campos.fecha_asignado || campos.fechaAsignado,
      );
      const fechaCompletadoISO = this._deArgentinoAISO(
        campos.fecha_completado || campos.fechaCompletado,
      );

      const payloadFiltrado = {
        conductor: (campos.conductor || "").trim(),
        fecha_asignado: fechaAsignadoISO,
        fecha_completado: fechaCompletadoISO || null,
        cantidad_abarcado:
          campos.cantidad_abarcado || campos.cantidad || "Completo",
      };

      console.log("📤 Enviando payload sanitizado a FastAPI:", payloadFiltrado);

      const result = await Api.actualizarAsignacion(id, payloadFiltrado);

      if (onSuccess) onSuccess();
      await this.cargarDashboardCompleto("1-20");

      console.log("🔄 Dashboard recargado en tiempo real.");
    } catch (error) {
      console.error("❌ Error al actualizar asignación:", error);
      alert("Error al actualizar la asignación.");
      throw error;
    }
  },

  async eliminarAsignacion(id, onSuccess) {
    if (!confirm("¿Eliminar esta asignación?")) return;
    try {
      const result = await Api.eliminarAsignacion(id);
      UIManager.mostrarMensaje(result.message || "Eliminada.", "success");
      if (onSuccess) onSuccess();
      this.cargarDashboardCompleto();
    } catch (error) {
      UIManager.mostrarMensaje("Error al eliminar.", "error");
    }
  },

  async cargarDashboardCompleto(rango = "1-20") {
    try {
      UIManager.showLoading(true);

      const response = await Api.getSugerencias(rango);
      const territorios = response.sugerencias || response;

      UIManager.renderSugerencias(territorios);

      if (window.Charts && window.Charts.renderBarChart) {
        const labels = territorios.map((t) => `T-${t.numero}`);
        const values = this._calcularDiasAtraso(territorios);

        console.log("📊 Datos cargados para gráfico:", { labels, values });

        window.Charts.renderBarChart(
          "asignacionesChart",
          labels,
          values,
          "#10b981",
        );
      }

      try {
        const [totalPlanillasRes, planillasCompletasRes] = await Promise.all([
          Api.getTotalPlanillas().catch(() => null),
          Api.getTotalPlanillasCompletas().catch(() => null),
        ]);

        const elTotalTerritorios = document.getElementById("totalAsignaciones");
        if (elTotalTerritorios) {
          elTotalTerritorios.textContent = 60;
        }

        const elPlanillasTotales =
          document.getElementById("territoriosActivos");
        if (elPlanillasTotales && totalPlanillasRes !== null) {
          const totalPlanillasVal =
            typeof totalPlanillasRes === "object"
              ? (totalPlanillasRes.total ??
                totalPlanillasRes.count ??
                JSON.stringify(totalPlanillasRes))
              : totalPlanillasRes;
          elPlanillasTotales.textContent = totalPlanillasVal;
        }

        const elPlanillasCompletadas = document.getElementById(
          "asignacionesCompletadas",
        );
        if (elPlanillasCompletadas && planillasCompletasRes !== null) {
          const completasVal =
            typeof planillasCompletasRes === "object"
              ? (planillasCompletasRes.total ??
                planillasCompletasRes.count ??
                JSON.stringify(planillasCompletasRes))
              : planillasCompletasRes;
          elPlanillasCompletadas.textContent = completasVal;
        }
      } catch (kpiError) {
        console.error(
          "❌ Error al actualizar los KPIs del dashboard:",
          kpiError,
        );
      }
    } catch (error) {
      console.error("❌ Error al cargar dashboard:", error);
    } finally {
      UIManager.showLoading(false);
    }
  },

  _calcularDiasAtraso(territorios) {
    return territorios.map((t) => {
      const valor = t.dias_atraso !== undefined ? t.dias_atraso : 0;
      return valor === 0 ? 0.5 : valor;
    });
  },

  async obtenerDetalleTerritorio(numero) {
    const res = await Api.getTerritorio(numero);
    return {
      asignaciones: res.asignaciones,
      stats: res.estadisticas || res.proporciones || [10, 20, 30],
    };
  },

  async generarPropuesta(fechaInicio) {
    UIManager.showLoading(true);
    try {
      const plan = await Api.generarPlanQuincenal(fechaInicio);
      UIManager.renderizarPropuestaAgenda(plan);
    } catch (error) {
      console.error("Error al generar plan:", error);
      UIManager.mostrarMensaje("No se pudo generar la propuesta", "error");
    } finally {
      UIManager.showLoading(false);
    }
  },

  async confirmarAgenda() {
    const filas = document.querySelectorAll(".agenda-row");

    const items = Array.from(filas).map((fila) => {
      const selectConductor = fila.querySelector(".select-conductor");
      const cellEncuentro = fila.querySelector(".encounter-cell");

      const conductorId = selectConductor.value
        ? parseInt(selectConductor.value)
        : null;
      const selectedOption =
        selectConductor.options[selectConductor.selectedIndex];
      const conductorNombre = selectedOption
        ? selectedOption.getAttribute("data-nombre")
        : "Sin asignar";

      return {
        territorio_id: parseInt(fila.dataset.territorioId),
        conductor_id: conductorId,
        conductor: conductorNombre,
        fecha_asignado: fila.dataset.fecha,
        turno: fila.dataset.turno,
        punto_encuentro: cellEncuentro.innerText || "Salón del Reino",
      };
    });

    if (items.length === 0) {
      UIManager.mostrarMensaje("No hay datos para confirmar", "error");
      return;
    }

    try {
      UIManager.showLoading(true);
      await Api.confirmarAgenda({ items: items });

      UIManager.mostrarMensaje("¡Agenda confirmada y archivada!", "success");

      document.getElementById("containerPropuesta").innerHTML = "";
      this.cargarDashboardCompleto();
    } catch (error) {
      console.error("Error al confirmar:", error);
      UIManager.mostrarMensaje(
        error.detail || "Error al guardar la agenda",
        "error",
      );
    } finally {
      UIManager.showLoading(false);
    }
  },

  async cargarHistorial() {
    try {
      const propuesta = await Api.getSugerenciaCombinada();
      UIManager.renderizarHistorialAgenda(propuesta);
    } catch (error) {
      console.error("Error cargando historial:", error);
    }
  },

  // --- PLANILLA ---
  planillasCache: [],
  zonaActualPlanillas: null,
  anioActualPlanillas: null,

  _prepararContenedoresPlanillas() {
    // ⚡ Quita límites de ancho del HTML padre sin alterar los otros módulos
    const seccion = document.getElementById("seccionPlanillaS13");
    if (seccion) {
      seccion.style.width = "100%";
      seccion.style.maxWidth = "100%";
      seccion.style.padding = "0";

      const formCard = seccion.querySelector(".form-card");
      if (formCard) {
        formCard.style.width = "100%";
        formCard.style.maxWidth = "100%";
        formCard.style.border = "none";
        formCard.style.padding = "0";
        formCard.style.background = "transparent";
        formCard.style.boxShadow = "none";
      }
    }

    const container = document.getElementById("containerPlanillas");
    if (container) {
      container.style.width = "100%";
      container.style.maxWidth = "100%";
    }
  },

  async initPlanillas() {
    try {
      UIManager.showLoading(true);
      this._prepararContenedoresPlanillas();

      this.planillasCache = await Api.getPlanillas();
      this.renderZonasPlanillas();
    } catch (error) {
      console.error("❌ Error al cargar planillas:", error);
      UIManager.mostrarMensaje("No se pudieron cargar las planillas", "error");
    } finally {
      UIManager.showLoading(false);
    }
  },

  renderZonasPlanillas() {
    this.zonaActualPlanillas = null;
    this.anioActualPlanillas = null;

    const titulo = document.getElementById("planillasTituloSeccion");
    const btnVolver = document.getElementById("btnVolverPlanillas");
    const container = document.getElementById("containerPlanillas");

    if (titulo) titulo.innerText = "Zonas Disponibles";
    if (btnVolver) btnVolver.classList.add("hidden");
    if (!container) return;

    this._prepararContenedoresPlanillas();

    const zonas = [1, 2, 3];

    container.innerHTML = `
      <div style="width: 100%; border: 1px solid var(--gray-100); border-radius: 8px; overflow: hidden; background: var(--white); font-family: var(--font-main); box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: var(--gray-50); border-bottom: 1px solid var(--gray-100); font-size: 12px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.05em;">
          <span>Zona / Ubicación</span>
          <span>Acción</span>
        </div>
        <div style="display: flex; flex-direction: column; width: 100%;">
          ${zonas
            .map(
              (z) => `
            <div class="card-zona" data-zona="${z}" style="display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--gray-100); cursor: pointer; transition: background 0.15s ease; width: 100%; box-sizing: border-box;" onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background='transparent'">
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="display: flex; align-items: center; color: var(--gray-600);">
                  <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                </div>
                <div>
                  <div style="font-size: 14px; font-weight: 600; color: var(--gray-900);">Zona ${z}</div>
                  <div style="font-size: 12px; color: var(--gray-400); margin-top: 2px;">Explorar carpetas por año</div>
                </div>
              </div>
              <div style="font-size: 13px; font-weight: 500; color: var(--green-600); font-family: var(--font-mono); white-space: nowrap;">
                Explorar &rarr;
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  },

  seleccionarZonaPlanillas(zona) {
    this.zonaActualPlanillas = zona;
    this.anioActualPlanillas = null;

    const titulo = document.getElementById("planillasTituloSeccion");
    const btnVolver = document.getElementById("btnVolverPlanillas");
    const container = document.getElementById("containerPlanillas");

    if (titulo) titulo.innerText = `Zona ${zona} — Años`;
    if (btnVolver) btnVolver.classList.remove("hidden");

    this._prepararContenedoresPlanillas();

    const anios = [
      ...new Set(
        this.planillasCache.filter((p) => p.zona === zona).map((p) => p.anio),
      ),
    ].sort((a, b) => b - a);

    container.innerHTML = `
      <div style="width: 100%; border: 1px solid var(--gray-100); border-radius: 8px; overflow: hidden; background: var(--white); font-family: var(--font-main); box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: var(--gray-50); border-bottom: 1px solid var(--gray-100); font-size: 12px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.05em;">
          <span>Período</span>
          <span>Acción</span>
        </div>
        <div style="display: flex; flex-direction: column; width: 100%;">
          ${anios
            .map(
              (anio) => `
            <div class="planilla-card-item" onclick="Controller.seleccionarAnioPlanillas(${anio})" style="display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--gray-100); cursor: pointer; transition: background 0.15s ease; width: 100%; box-sizing: border-box;" onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background='transparent'">
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="display: flex; align-items: center; color: var(--gray-600);">
                  <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <div style="font-size: 14px; font-weight: 600; color: var(--gray-900); font-family: var(--font-mono);">Año ${anio}</div>
                  <div style="font-size: 12px; color: var(--gray-400); margin-top: 2px;">Planillas registradas en este período</div>
                </div>
              </div>
              <div style="font-size: 13px; font-weight: 500; color: var(--green-600); font-family: var(--font-mono); white-space: nowrap;">
                Abrir &rarr;
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  },

  seleccionarAnioPlanillas(anio) {
    this.anioActualPlanillas = anio;

    const titulo = document.getElementById("planillasTituloSeccion");
    const container = document.getElementById("containerPlanillas");

    if (titulo)
      titulo.innerText = `Zona ${this.zonaActualPlanillas} / Año ${anio}`;

    this._prepararContenedoresPlanillas();

    const planillasFiltradas = this.planillasCache.filter(
      (p) => p.zona === this.zonaActualPlanillas && p.anio === anio,
    );

    container.innerHTML = `
      <div style="width: 100%; border: 1px solid var(--gray-100); border-radius: 8px; overflow: hidden; background: var(--white); font-family: var(--font-main); box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: var(--gray-50); border-bottom: 1px solid var(--gray-100); font-size: 12px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.05em;">
          <span>Nombre de la Planilla</span>
          <span>Enlace</span>
        </div>
        <div style="display: flex; flex-direction: column; width: 100%;">
          ${planillasFiltradas
            .map(
              (p) => `
            <div onclick="Controller.abrirGoogleSheet('${p.spreadsheet_id}')" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--gray-100); cursor: pointer; transition: background 0.15s ease; width: 100%; box-sizing: border-box;" onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background='transparent'">
              <div style="display: flex; align-items: center; gap: 16px; overflow: hidden; padding-right: 16px;">
                <div style="display: flex; align-items: center; color: var(--green-600); flex-shrink: 0;">
                  <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div style="overflow: hidden;">
                  <div style="font-size: 14px; font-weight: 600; color: var(--gray-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${p.nombre_planilla}">
                    ${p.nombre_planilla}
                  </div>
                  <div style="font-size: 11px; color: var(--gray-400); margin-top: 2px;">Google Sheets</div>
                </div>
              </div>
              <div style="font-size: 13px; font-weight: 500; color: var(--green-600); font-family: var(--font-mono); white-space: nowrap; flex-shrink: 0;">
                Abrir ↗
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  },

  volverNivelPlanillas() {
    if (this.anioActualPlanillas !== null) {
      this.seleccionarZonaPlanillas(this.zonaActualPlanillas);
    } else if (this.zonaActualPlanillas !== null) {
      this.renderZonasPlanillas();
    }
  },

  abrirGoogleSheet(spreadsheetId) {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    window.open(url, "_blank");
  },

  // --- REPORTE SEMANAL CONSOLIDADO ---
  semanasConReportesCache: [],

  async initReporteSemanal() {
    try {
      UIManager.showLoading(true);

      // 1. Obtenemos el listado de semanas con reportes anidados del backend
      this.semanasConReportesCache = await Api.getSemanasConReportes();

      const selectSemana = document.getElementById("selectSemanaReporte");
      if (!selectSemana) return;

      selectSemana.innerHTML = "";

      if (
        !this.semanasConReportesCache ||
        this.semanasConReportesCache.length === 0
      ) {
        selectSemana.innerHTML = `<option value="">Sin semanas registradas</option>`;
        UIManager.renderTablaReporteSemanal([]);
        return;
      }

      // 2. Poblamos el selector con los labels formateados por el backend
      this.semanasConReportesCache.forEach((semana, index) => {
        const option = document.createElement("option");
        option.value = index; // Guardamos el índice en el array para recuperarlo rápido
        option.textContent = semana.label;
        selectSemana.appendChild(option);
      });

      // 3. Renderizamos por defecto la primera semana (la más reciente)
      selectSemana.value = 0;
      this.seleccionarSemanaReporte(0);

      // 4. Asignamos el listener para cuando el usuario cambie la opción
      selectSemana.onchange = (e) => {
        const idx = parseInt(e.target.value, 10);
        this.seleccionarSemanaReporte(idx);
      };
    } catch (error) {
      console.error("❌ Error al cargar reportes semanales:", error);
      UIManager.mostrarMensaje(
        "No se pudieron cargar los reportes semanales",
        "error",
      );
    } finally {
      UIManager.showLoading(false);
    }
  },

  seleccionarSemanaReporte(index) {
    const semana = this.semanasConReportesCache[index];
    if (!semana) return;

    // Le pasamos los reportes anidados de esa semana a la UI
    UIManager.renderTablaReporteSemanal(semana.reportes);
  },
};

window.Controller = Controller;
