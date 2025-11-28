// === diagnostico_motor.js — SHADOW 3.5 =======================================
// Versión híbrida: Diseño original Shadow 3.0 + Datos reales Shadow 4.0 backend
// Mantiene tabs CLEAN | RAW | QUALITY con toda la estética original
// RAW incluye: última vela cruda + última limpia + 10 velas limpias + errores
// ==============================================================================

const URL_BACKEND = "https://ultron-backend-zvtm.onrender.com";

// ================================================================
// Leer símbolo actual desde barra de escaneo
// ================================================================
function shadowLeerActivoActual() {
  const el = document.getElementById("estado-escaneo");
  if (!el) return null;

  const texto = el.textContent || "";
  const match = texto.match(/Escaneando:\s*([A-Z0-9\/\.\-]+)\s*–/i);
  if (!match) return null;

  return match[1].trim();
}

// Helpers
function num(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}
function check(c) {
  return c ? "✔" : "✖";
}

// ================================================================
// Tabs CLEAN / RAW / QUALITY
// ================================================================
function activarTab(tabId) {
  const tabs = document.querySelectorAll(".diag-tab");
  const panels = document.querySelectorAll(".diag-tabpanel");

  tabs.forEach(t => t.classList.remove("activo"));
  panels.forEach(p => p.classList.remove("activo"));

  const activeTab = document.querySelector(`.diag-tab[data-tab="${tabId}"]`);
  const activePanel = document.getElementById(`tab-${tabId}`);

  if (activeTab) activeTab.classList.add("activo");
  if (activePanel) activePanel.classList.add("activo");
}

// ================================================================
// CLEAN — Condiciones de estrategia vs realidad
// ================================================================
function renderClean(data, simbolo) {
  const ohlc = data.ohlc || {};
  const indicadores = data.indicadores || {};
  const supertrend = data.supertrend || {};
  const ruptura = data.ruptura || {};
  const estructura = data.estructura || {};

  const precioActual = num(ohlc.precioActual);
  const totalVelas = Array.isArray(data.velas) ? data.velas.length : 0;

  const adx = num(indicadores.adx);
  const atr = num(indicadores.atr);

  const stRiskR = (supertrend.riesgo && supertrend.riesgo.rapido) || {};
  const stRiskL = (supertrend.riesgo && supertrend.riesgo.lento) || {};

  const condiciones = [
    {
      label: "ADX mínimo",
      requerido: "≥ 10",
      actual: adx.toFixed(2),
      ok: adx >= 10
    },
    {
      label: "Velas disponibles",
      requerido: "≥ 50",
      actual: totalVelas,
      ok: totalVelas >= 50
    },
    {
      label: "ST Riesgo alineado",
      requerido: "Rápido = Lento ≠ OFF",
      actual: `${stRiskR.estado || "OFF"} / ${stRiskL.estado || "OFF"}`,
      ok:
        stRiskR.estado &&
        stRiskR.estado === stRiskL.estado &&
        stRiskR.estado !== "OFF"
    },
    {
      label: "Ruptura swing",
      requerido: "HL_break o LH_break",
      actual: `${ruptura.tipo || "ninguna"} / ${ruptura.direccion || "0"} / ${ruptura.distancia || 0}`,
      ok: ruptura.tipo && ruptura.tipo !== "ninguna"
    },
    {
      label: "Estructura institucional",
      requerido: "estructuraValida = true",
      actual: estructura.estructuraValida ? "VÁLIDA" : "NO válida",
      ok: !!estructura.estructuraValida
    }
  ];

  const resumenHtml = `
    <div class="diag-resumen-grid">
      <div><span class="diag-label">Activo</span><span class="diag-value">${simbolo}</span></div>
      <div><span class="diag-label">Precio</span><span class="diag-value">${precioActual}</span></div>
      <div><span class="diag-label">ADX</span><span class="diag-value">${adx.toFixed(2)}</span></div>
      <div><span class="diag-label">ATR</span><span class="diag-value">${atr.toFixed(5)}</span></div>
      <div><span class="diag-label">Ruptura</span><span class="diag-value">${ruptura.tipo || "ninguna"}</span></div>
      <div><span class="diag-label">Distancia</span><span class="diag-value">${ruptura.distancia || 0}</span></div>
    </div>
  `;

  const tablaCondiciones = `
    <div class="diag-shadow">
      <h3>Condiciones de estrategia vs realidad (CLEAN)</h3>
      <table class="diag-tabla">
        <thead>
          <tr>
            <th>Condición</th>
            <th>Requerido</th>
            <th>Actual</th>
            <th>OK</th>
          </tr>
        </thead>
        <tbody>
          ${condiciones.map(c => `
            <tr>
              <td>${c.label}</td>
              <td>${c.requerido}</td>
              <td>${c.actual}</td>
              <td>${check(c.ok)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  return resumenHtml + tablaCondiciones;
}

// ================================================================
// RAW — vela cruda + vela limpia + 10 velas limpias + errores
// ================================================================
function renderRaw(data) {
  const raw = data.raw || {};
  const ultimaCruda = raw.ultima || {};

  const velasLimpias = Array.isArray(data.velas)
  ? data.velas.filter(v => v && v.high != null && v.low != null && v.close != null)
  : [];

  const ultimaLimpia = velasLimpias.at(-1) || {};
  const ultimas10 = velasLimpias.slice(-10);

  const calidad = data.calidad || {};

  return `
    <div class="diag-raw">
      <h3>Datos crudos desde API (RAW)</h3>

      <div class="diag-raw-grid">

        <div>
          <span class="diag-label">Última vela CRUDA</span>
          <pre class="diag-raw-pre">${JSON.stringify(ultimaCruda, null, 2)}</pre>
        </div>

        <div>
          <span class="diag-label">Última vela LIMPIA</span>
          <pre class="diag-raw-pre">${JSON.stringify(ultimaLimpia, null, 2)}</pre>
        </div>

      </div>

      <h3>Últimas 10 velas limpias</h3>
      <pre class="diag-raw-pre">${JSON.stringify(ultimas10, null, 2)}</pre>

      <h3>Errores detectados en velas</h3>
      <ul class="diag-raw-lista">
        <li>Total velas: <strong>${calidad.totalVelas || 0}</strong></li>
        <li>Errores totales: <strong>${calidad.erroresTotales || 0}</strong></li>
        <li>Sin HIGH: <strong>${calidad.sinHigh || 0}</strong></li>
        <li>Sin LOW: <strong>${calidad.sinLow || 0}</strong></li>
        <li>Sin CLOSE: <strong>${calidad.sinClose || 0}</strong></li>
        <li>Valores NaN: <strong>${calidad.nanValores || 0}</strong></li>
        <li>HIGH &lt; LOW: <strong>${calidad.highMenorLow || 0}</strong></li>
      </ul>

    </div>
  `;
}

// ================================================================
// QUALITY — integridad total del feed
// ================================================================
function renderQuality(data) {
  const calidad = data.calidad || {};
  const nivel = calidad.nivel || "DESCONOCIDO";

  let badgeClass = "quality-badge-ok";
  if (nivel === "REGULAR") badgeClass = "quality-badge-mid";
  if (nivel === "CRÍTICA") badgeClass = "quality-badge-bad";

  return `
    <div class="diag-quality">
      <h3>Calidad del feed de datos (QUALITY)</h3>

      <div class="diag-quality-header">
        <span class="diag-label">Calidad general</span>
        <span class="quality-badge ${badgeClass}">${nivel}</span>
      </div>

      <div class="diag-quality-grid">
        <div>
          <span class="diag-label">Velas analizadas</span>
          <span class="diag-value">${calidad.totalVelas || 0}</span>
        </div>
        <div>
          <span class="diag-label">Errores totales</span>
          <span class="diag-value">${calidad.erroresTotales || 0}</span>
        </div>
      </div>

      <div class="diag-quality-detalle">
        <p>Detalles del análisis RAW:</p>
        <ul>
          <li>Sin HIGH: <strong>${calidad.sinHigh || 0}</strong></li>
          <li>Sin LOW: <strong>${calidad.sinLow || 0}</strong></li>
          <li>Sin CLOSE: <strong>${calidad.sinClose || 0}</strong></li>
          <li>Valores NaN: <strong>${calidad.nanValores || 0}</strong></li>
          <li>HIGH &lt; LOW: <strong>${calidad.highMenorLow || 0}</strong></li>
        </ul>
      </div>
    </div>
  `;
}

// ================================================================
// FUNCIÓN PRINCIPAL — SHADOW 3.5
// ================================================================
export async function cargarDiagnosticoMotor(_simbolo, _intervalo) {
  const cont = document.getElementById("ultron-diagnostico");
  const estadoEl = document.getElementById("diag-estado");
  const cuerpoEl = document.getElementById("diag-contenido");

  if (!cont || !estadoEl || !cuerpoEl) return;

  const simbolo = shadowLeerActivoActual() || _simbolo || "EUR/USD";
  const intervalo = _intervalo || "1h";

  estadoEl.textContent = `Analizando ${simbolo}...`;

  try {
    // Endpoint actualizado para activar Shadow 3.5 REAL (forceShadow activado)
const url = `${URL_BACKEND}/diagnostico?simbolo=${encodeURIComponent(simbolo)}&intervalo=${encodeURIComponent(intervalo)}`;



    const resp = await fetch(url);
    const data = await resp.json();

    cuerpoEl.innerHTML = `
      <div class="diag-tabs">
        <button class="diag-tab activo" data-tab="clean">CLEAN</button>
        <button class="diag-tab" data-tab="raw">RAW</button>
        <button class="diag-tab" data-tab="quality">QUALITY</button>
      </div>

      <div id="tab-clean" class="diag-tabpanel activo">${renderClean(data, simbolo)}</div>
      <div id="tab-raw" class="diag-tabpanel">${renderRaw(data)}</div>
      <div id="tab-quality" class="diag-tabpanel">${renderQuality(data)}</div>
    `;

    estadoEl.textContent = `Shadow 3.5 activo — ${simbolo}`;

    // Activar pestañas
    const tabButtons = cont.querySelectorAll(".diag-tab");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab");
        activarTab(tabId);
      });
    });

  } catch (err) {
    console.error("Error cargando Shadow 3.5:", err);
    estadoEl.textContent = "Error en diagnóstico";
    cuerpoEl.innerHTML = `<p class="diag-error">❌ Error al conectar con el backend Shadow.</p>`;
  }
}

// ================================================================
// Auto-follow del escáner cada 4s
// ================================================================
setInterval(() => {
  const activo = shadowLeerActivoActual();
  if (activo) {
    cargarDiagnosticoMotor(activo, "1h");
  }
}, 4000);
