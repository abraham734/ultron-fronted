// === diagnostico_motor.js — Shadow 3.6 =================================================
// Versión totalmente alineada con Shadow 3.6 backend
// =======================================================================================

const URL_BACKEND = "https://ultron-backend-zvtm.onrender.com";

// ================================================================
// Detectar activo actual del escáner
// ================================================================
function shadowLeerActivoActual() {
  const el = document.getElementById("estado-escaneo");
  if (!el) return null;

  const texto = el.textContent || "";
  const match = texto.match(/Escaneando:\s*([A-Z0-9\/\.\-]+)\s*–/i);

  return match ? match[1].trim() : null;
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
// CLEAN — Condiciones reales de estrategia
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

  // ==============================
  // ENCABEZADO GRID NUEVO
  // ==============================
  const resumenHtml = `
    <div class="diag-header-grid">
      <div><span class="diag-label">Activo</span><span class="diag-value">${simbolo}</span></div>
      <div><span class="diag-label">Precio</span><span class="diag-value">${precioActual}</span></div>
      <div><span class="diag-label">ADX</span><span class="diag-value">${adx.toFixed(2)}</span></div>
      <div><span class="diag-label">ATR</span><span class="diag-value">${atr.toFixed(5)}</span></div>
      <div><span class="diag-label">Ruptura</span><span class="diag-value">${ruptura.tipo || "ninguna"}</span></div>
      <div><span class="diag-label">Distancia</span><span class="diag-value">${ruptura.distancia || 0}</span></div>
    </div>
  `;

  // ==============================
  // TABLA CLEAN
  // ==============================
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
      requerido: "consolidación = true",
      actual: estructura.consolidacion ? "VÁLIDA" : "NO válida",
      ok: !!estructura.consolidacion
    }
  ];

  const tablaCondiciones = `
    <div class="diag-shadow">
      <h3>Condiciones reales de la estrategia (CLEAN)</h3>
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
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  return resumenHtml + tablaCondiciones;
}

// ================================================================
// RAW — vela cruda + vela limpia + 10 velas
// ================================================================
function renderRaw(data) {
  const raw = data.raw || {};
  const ultimaCruda = raw.ultima || {};

  const velasLimpias = Array.isArray(data.velas)
    ? data.velas.filter(
        v =>
          v &&
          Number(v.open) > 0 &&
          Number(v.high) > 0 &&
          Number(v.low) > 0 &&
          Number(v.close) > 0
      )
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
// QUALITY — integridad del feed
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
// FUNCIÓN PRINCIPAL — Shadow 3.6 Frontend
// ================================================================
export async function cargarDiagnosticoMotor(_simbolo, _intervalo) {
  const cont = document.getElementById("ultron-diagnostico");
  const estadoEl = document.getElementById("diag-estado");
  const cuerpoEl = document.getElementById("diag-contenido");

  if (!cont || !estadoEl || !cuerpoEl) return;

  const simbolo = shadowLeerActivoActual() || _simbolo || "EUR/USD";
  const intervalo = _intervalo || "30min";

  estadoEl.textContent = `Analizando ${simbolo}...`;

  try {
    const url = `${URL_BACKEND}/diagnostico?simbolo=${encodeURIComponent(
      simbolo
    )}&intervalo=${encodeURIComponent(intervalo)}&shadow=1`;

    const resp = await fetch(url);
    const data = await resp.json();

    cuerpoEl.innerHTML = `
      <div class="diag-tabs">
        <button class="diag-tab activo" data-tab="clean">CLEAN</button>
        <button class="diag-tab" data-tab="raw">RAW</button>
        <button class="diag-tab" data-tab="quality">QUALITY</button>
      </div>

      <div id="tab-clean" class="diag-tabpanel activo">${renderClean(
        data,
        simbolo
      )}</div>
      <div id="tab-raw" class="diag-tabpanel">${renderRaw(data)}</div>
      <div id="tab-quality" class="diag-tabpanel">${renderQuality(
        data
      )}</div>
    `;

    estadoEl.textContent = `Shadow 3.6 activo — ${simbolo}`;

    document.querySelectorAll(".diag-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        activarTab(btn.getAttribute("data-tab"));
      });
    });

  } catch (err) {
    console.error("Error cargando Shadow 3.6:", err);
    estadoEl.textContent = "Error en diagnóstico";
    cuerpoEl.innerHTML = `<p class="diag-error">❌ Error al conectar con el backend Shadow.</p>`;
  }
}

// ================================================================
// Auto-follow
// ================================================================
setInterval(() => {
  const activo = shadowLeerActivoActual();
  if (activo) cargarDiagnosticoMotor(activo, "30min");
}, 4000);
