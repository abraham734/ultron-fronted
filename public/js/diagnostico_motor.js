// === diagnostico_motor.js — SHADOW 3.0 FRONTEND ===============================
// Panel con pestañas: CLEAN | RAW | QUALITY
// - CLEAN: Condiciones de la estrategia vs lo que ocurre en mercado.
// - RAW:   Datos crudos de la API (posible basura).
// - QUALITY: Resumen técnico de integridad del feed.
// ==============================================================================

const URL_BACKEND = "https://ultron-backend-zvtm.onrender.com";

// Leer símbolo actual desde la barra de escaneo
function shadowLeerActivoActual() {
  const el = document.getElementById("estado-escaneo");
  if (!el) return null;

  const texto = el.textContent || "";
  const match = texto.match(/Escaneando:\s*([A-Z0-9\/\.\-]+)\s*–/i);
  if (!match) return null;

  return match[1].trim();
}

function num(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function check(c) {
  return c ? "✔" : "✖";
}

// ================================================================
// Tabs: mostrar solo uno
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
// RENDER CLEAN (condiciones vs realidad)
// ================================================================
function renderClean(data, simbolo) {
  const ohlc = data.ohlc || {};
  const indicadores = data.indicadores || {};
  const supertrend = data.supertrend || {};
  const ruptura = data.ruptura || {};
  const estructura = data.estructura || {};

  const precioActual = num(ohlc.precioActual);
  const totalVelas = num(ohlc.total);

  const adx = num(indicadores.adx);
  const atr = num(indicadores.atr);

  const stRiskR = (supertrend.riesgo && supertrend.riesgo.rapido) || {};
  const stRiskL = (supertrend.riesgo && supertrend.riesgo.lento) || {};

  const stR_str = `${stRiskR.estado || "OFF"} / ${num(stRiskR.supertrend)}`;
  const stL_str = `${stRiskL.estado || "OFF"} / ${num(stRiskL.supertrend)}`;

  // Condiciones básicas de la estrategia supertrend doble (riesgo)
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
      <div>
        <span class="diag-label">Activo</span>
        <span class="diag-value">${simbolo}</span>
      </div>
      <div>
        <span class="diag-label">Precio</span>
        <span class="diag-value">${precioActual}</span>
      </div>
      <div>
        <span class="diag-label">ADX</span>
        <span class="diag-value">${adx.toFixed(2)}</span>
      </div>
      <div>
        <span class="diag-label">ATR</span>
        <span class="diag-value">${atr.toFixed(5)}</span>
      </div>
      <div>
        <span class="diag-label">Ruptura</span>
        <span class="diag-value">${ruptura.tipo || "ninguna"}</span>
      </div>
      <div>
        <span class="diag-label">Distancia</span>
        <span class="diag-value">${ruptura.distancia || 0}</span>
      </div>
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
          ${condiciones
            .map(
              c => `
            <tr>
              <td>${c.label}</td>
              <td>${c.requerido}</td>
              <td>${c.actual}</td>
              <td>${check(c.ok)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  return resumenHtml + tablaCondiciones;
}

// ================================================================
// RENDER RAW (datos crudos / posibles basuras)
// ================================================================
function renderRaw(data) {
  const raw = data.raw || {};
  const ultima = raw.ultima || {};
  const resumenErrores = raw.resumenErrores || {};

  const jsonUltima = JSON.stringify(ultima, null, 2);

  return `
    <div class="diag-raw">
      <h3>Datos crudos desde API (RAW)</h3>
      <div class="diag-raw-grid">
        <div>
          <span class="diag-label">Última vela (cruda)</span>
          <pre class="diag-raw-pre">${jsonUltima}</pre>
        </div>
        <div>
          <span class="diag-label">Errores detectados en velas</span>
          <ul class="diag-raw-lista">
            <li>Total de velas analizadas: <strong>${resumenErrores.totalVelas || 0}</strong></li>
            <li>Errores totales: <strong>${resumenErrores.erroresTotales || 0}</strong></li>
            <li>Sin HIGH: <strong>${resumenErrores.sinHigh || 0}</strong></li>
            <li>Sin LOW: <strong>${resumenErrores.sinLow || 0}</strong></li>
            <li>Sin CLOSE: <strong>${resumenErrores.sinClose || 0}</strong></li>
            <li>Valores NaN: <strong>${resumenErrores.nanValores || 0}</strong></li>
            <li>HIGH &lt; LOW: <strong>${resumenErrores.highMenorLow || 0}</strong></li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

// ================================================================
// RENDER QUALITY (score de integridad)
// ================================================================
function renderQuality(data) {
  const calidad = data.calidad || {};
  const nivel = calidad.nivel || "DESCONOCIDO";
  const errores = num(calidad.erroresTotales || 0);
  const totalVelas = num(calidad.totalVelas || 0);

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
          <span class="diag-value">${totalVelas}</span>
        </div>
        <div>
          <span class="diag-label">Errores totales</span>
          <span class="diag-value">${errores}</span>
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
// FUNCIÓN PRINCIPAL — carga y render de SHADOW 3.0
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
    const url = `${URL_BACKEND}/diagnostico?simbolo=${encodeURIComponent(
      simbolo
    )}&intervalo=${encodeURIComponent(intervalo)}`;

    const resp = await fetch(url);
    const data = await resp.json();

    // Construir estructura de tabs
    const tabsHtml = `
      <div class="diag-tabs">
        <button class="diag-tab activo" data-tab="clean">CLEAN</button>
        <button class="diag-tab" data-tab="raw">RAW</button>
        <button class="diag-tab" data-tab="quality">QUALITY</button>
      </div>

      <div id="tab-clean" class="diag-tabpanel activo">
        ${renderClean(data, simbolo)}
      </div>
      <div id="tab-raw" class="diag-tabpanel">
        ${renderRaw(data)}
      </div>
      <div id="tab-quality" class="diag-tabpanel">
        ${renderQuality(data)}
      </div>
    `;

    cuerpoEl.innerHTML = tabsHtml;
    estadoEl.textContent = `Shadow 3.0 activo — ${simbolo}`;

    // Wire de pestañas
    const tabButtons = cont.querySelectorAll(".diag-tab");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab");
        activarTab(tabId);
      });
    });

  } catch (err) {
    console.error("Error cargando Shadow 3.0:", err);
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
