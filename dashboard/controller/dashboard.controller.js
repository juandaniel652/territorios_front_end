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
      // OJO: Recordá que Api.getTerritorio debe estar en api.service.js
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

    // CORREGIDO: Validamos 'numero_territorio' que es lo que viene de events.js y espera el backend
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

      // Refresca las tarjetas y gráficos del Dashboard principal
      this.cargarDashboardCompleto();
    } catch (error) {
      console.error("❌ Error atrapado en Controller.crearAsignacion:", error);

      // Logueamos la estructura completa del error para inspección directa
      console.dir(error);

      // Manejo robusto de la respuesta detallada de FastAPI (422 u otros)
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

      // 1. Renderiza las tarjetas de texto
      UIManager.renderSugerencias(listaSugerida);

      // 2. ¡CLAVE! Actualiza el gráfico con el mismo rango
      // Esto hace que el Dashboard sea congruente con lo que ves arriba
      this.actualizarSoloGrafico(listaSugerida);
    } catch (error) {
      console.error("❌ Error:", error);
    } finally {
      UIManager.showLoading(false);
    }
  },

  // Creamos esta pequeña función de apoyo para no repetir código
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

  // =========================================================================
  // FUNCIÓN AUXILIAR PARA CONVERTIR FECHAS DE "DD/MM/AAAA" A "YYYY-MM-DD"
  // =========================================================================
  _deArgentinoAISO(fechaArg) {
    if (!fechaArg) return null;
    // Si ya viene en formato ISO (YYYY-MM-DD), lo dejamos pasar tal cual
    if (fechaArg.includes("-")) return fechaArg;

    const partes = fechaArg.split("/"); // ["DD", "MM", "AAAA"]
    if (partes.length !== 3) return null;
    return `${partes[2]}-${partes[1]}-${partes[0]}`; // "AAAA-MM-DD"
  },

  async editarAsignacion(id, campos, onSuccess) {
    try {
      console.log("📥 Datos recibidos en el Controller para edición:", campos);

      // 1. Convertimos fechas al formato ISO (YYYY-MM-DD)
      const fechaAsignadoISO = this._deArgentinoAISO(
        campos.fecha_asignado || campos.fechaAsignado,
      );
      const fechaCompletadoISO = this._deArgentinoAISO(
        campos.fecha_completado || campos.fechaCompletado,
      );

      // 2. Construimos el payload exacto
      const payloadFiltrado = {
        conductor: (campos.conductor || "").trim(),
        fecha_asignado: fechaAsignadoISO,
        fecha_completado: fechaCompletadoISO || null,
        cantidad_abarcado:
          campos.cantidad_abarcado || campos.cantidad || "Completo",
      };

      console.log("📤 Enviando payload sanitizado a FastAPI:", payloadFiltrado);

      // 3. Enviamos el PUT a la API
      const result = await Api.actualizarAsignacion(id, payloadFiltrado);

      // 4. Si la API responde OK, ejecutamos el callback que cierra el modal
      if (onSuccess) onSuccess();

      // 5. ⚡ LA CLAVE: Volvemos a pedir y renderizar los datos actualizados de la lista
      // Si tu método necesita un rango por defecto (ej. "1-20"), pasáselo:
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

  // --- FUNCIONES DE AGENDA ---

  async cargarDashboardCompleto(rango = "1-20") {
    try {
      UIManager.showLoading(true);

      // 1. Pedir datos de sugerencias/territorios
      const response = await Api.getSugerencias(rango);
      const territorios = response.sugerencias || response;

      // 2. Renderizar tarjetas de sugerencias
      UIManager.renderSugerencias(territorios);

      // 3. Renderizar Gráfico
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

      // 4. ⚡ ACTUALIZAR KPIs DESDE LOS ENDPOINTS ⚡
      try {
        // Ejecutamos las peticiones en paralelo
        const [totalPlanillasRes, planillasCompletasRes] = await Promise.all([
          Api.getTotalPlanillas().catch(() => null),
          Api.getTotalPlanillasCompletas().catch(() => null),
        ]);

        // KPI 1: Total Territorios (obtenido de la cantidad de territorios recibidos o total único)
        const elTotalTerritorios = document.getElementById("totalAsignaciones");
        if (elTotalTerritorios) {
          elTotalTerritorios.textContent = 60;
        }

        // KPI 2: Planillas Totales
        const elPlanillasTotales =
          document.getElementById("territoriosActivos");
        if (elPlanillasTotales && totalPlanillasRes !== null) {
          // Extraemos el valor del JSON (ej: { total: 14 } o valor numérico directo)
          const totalPlanillasVal =
            typeof totalPlanillasRes === "object"
              ? (totalPlanillasRes.total ??
                totalPlanillasRes.count ??
                JSON.stringify(totalPlanillasRes))
              : totalPlanillasRes;
          elPlanillasTotales.textContent = totalPlanillasVal;
        }

        // KPI 3: Planillas Completadas
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
      // Usamos directamente el valor que manda el backend
      // Si no existe, devolvemos 0
      const valor = t.dias_atraso !== undefined ? t.dias_atraso : 0;

      // Un pequeño truco: si es 0, devolvemos 0.5 para que se vea
      // una línea verde mínima en el gráfico y no quede vacío.
      return valor === 0 ? 0.5 : valor;
    });
  },

  async obtenerDetalleTerritorio(numero) {
    const res = await Api.getTerritorio(numero);
    return {
      asignaciones: res.asignaciones,
      // Asegúrate de que esto sea lo que tu renderBarChart necesita:
      stats: res.estadisticas || res.proporciones || [10, 20, 30],
    };
  },

  async generarPropuesta(fechaInicio) {
    UIManager.showLoading(true);
    try {
      // Llama al endpoint que probamos antes en el navegador
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
    // Seleccionamos todas las filas de la tabla de agenda
    const filas = document.querySelectorAll(".agenda-row");

    const items = Array.from(filas).map((fila) => {
      const selectConductor = fila.querySelector(".select-conductor");
      const inputTerritorio = fila.querySelector(".territory-input");
      const cellEncuentro = fila.querySelector(".encounter-cell");

      // Obtenemos el ID del conductor seleccionado en el select
      const conductorId = selectConductor.value
        ? parseInt(selectConductor.value)
        : null;
      // Opcional: recuperamos el texto de la opción seleccionada para el nombre si el back lo pide
      const selectedOption =
        selectConductor.options[selectConductor.selectedIndex];
      const conductorNombre = selectedOption
        ? selectedOption.getAttribute("data-nombre")
        : "Sin asignar";

      return {
        territorio_id: parseInt(fila.dataset.territorioId),
        conductor_id: conductorId, // 📌 Mandamos el ID real seleccionado
        conductor: conductorNombre, // Nombre por compatibilidad si lo usa el modelo
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
      const propuesta = await Api.getSugerenciaCombinada(); // array de semanas
      UIManager.renderizarHistorialAgenda(propuesta); // pasa las semanas SIN aplanar
    } catch (error) {
      console.error("Error cargando historial:", error);
    }
  },

  // Planilla

  planillasCache: [],
  zonaActualPlanillas: null,
  anioActualPlanillas: null,

  async initPlanillas() {
    try {
      UIManager.showLoading(true);
      // 1. Consumimos el nuevo endpoint
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

    if (titulo) titulo.innerText = "Seleccione una Zona";
    if (btnVolver) btnVolver.classList.add("hidden");
    if (!container) return;

    const zonas = [1, 2, 3];

    container.innerHTML = zonas
      .map(
        (z) => `
      <div class="card-zona" data-zona="${z}" style="background: var(--white); border: 1px solid var(--gray-200); border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
        <div style="font-size: 32px; margin-bottom: 8px;">📂</div>
        <h4 style="font-size: 16px; font-weight: 600; color: var(--gray-900); margin: 0;">Zona ${z}</h4>
        <p style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">Explorar años y planillas</p>
      </div>
    `,
      )
      .join("");
  },

  seleccionarZonaPlanillas(zona) {
    this.zonaActualPlanillas = zona;
    this.anioActualPlanillas = null;

    const titulo = document.getElementById("planillasTituloSeccion");
    const btnVolver = document.getElementById("btnVolverPlanillas");
    const container = document.getElementById("containerPlanillas");

    if (titulo) titulo.innerText = `Zona ${zona} — Seleccione un Año`;
    if (btnVolver) btnVolver.classList.remove("hidden");

    // Filtrar años únicos para esta zona
    const anios = [
      ...new Set(
        this.planillasCache.filter((p) => p.zona === zona).map((p) => p.anio),
      ),
    ].sort((a, b) => b - a); // Más recientes primero

    container.innerHTML = anios
      .map(
        (anio) => `
      <div class="planilla-card-item" onclick="Controller.seleccionarAnioPlanillas(${anio})" style="background: var(--white); border: 1px solid var(--gray-200); border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
        <div style="font-size: 32px; margin-bottom: 8px;">📅</div>
        <h4 style="font-size: 16px; font-weight: 600; color: var(--gray-900); margin: 0;">Año ${anio}</h4>
        <p style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">Ver planillas registradas</p>
      </div>
    `,
      )
      .join("");
  },

  seleccionarAnioPlanillas(anio) {
    this.anioActualPlanillas = anio;

    const titulo = document.getElementById("planillasTituloSeccion");
    const container = document.getElementById("containerPlanillas");

    if (titulo)
      titulo.innerText = `Zona ${this.zonaActualPlanillas} / Año ${anio} — Planillas`;

    // Filtrar planillas por zona y año
    const planillasFiltradas = this.planillasCache.filter(
      (p) => p.zona === this.zonaActualPlanillas && p.anio === anio,
    );

    container.innerHTML = planillasFiltradas
      .map(
        (p) => `
      <div onclick="Controller.abrirGoogleSheet('${p.spreadsheet_id}')" style="background: var(--white); border: 1px solid var(--gray-200); border-radius: 12px; padding: 20px; text-align: left; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">📊</div>
        <div style="overflow: hidden;">
          <h4 style="font-size: 14px; font-weight: 600; color: var(--gray-900); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${p.nombre_planilla}">${p.nombre_planilla}</h4>
          <p style="font-size: 11px; color: var(--green-600); margin-top: 2px; font-weight: 500;">Abrir en Google Sheets ↗</p>
        </div>
      </div>
    `,
      )
      .join("");
  },

  volverNivelPlanillas() {
    if (this.anioActualPlanillas !== null) {
      // Si estamos en planillas, volvemos a selección de años
      this.seleccionarZonaPlanillas(this.zonaActualPlanillas);
    } else if (this.zonaActualPlanillas !== null) {
      // Si estamos en años, volvemos a selección de zonas
      this.renderZonasPlanillas();
    }
  },

  abrirGoogleSheet(spreadsheetId) {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    window.open(url, "_blank");
  },
};

window.Controller = Controller;

//FALTA AGREGAR DESD EENDPOINT MOSTRAR EN TIEMPO REAL PLANILLAS TOTALES Y PLANILLAS COMPLETAS TTOALES SON 6 YA ESTA
//HECHO
