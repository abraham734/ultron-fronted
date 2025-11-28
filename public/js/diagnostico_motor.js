// ==========================================================================
// === diagnostico_motor.js – SHADOW 3.5 FUSIONADO ==========================
// === Diagnóstico independiente del motor (Frontend) =======================
// === Totalmente sincronizado con el escáner y con indicadores reales =====
// ==========================================================================

// === IMPORTS DE INDICADORES (FRONTEND) ===
import { calcularEMA } from "./utils/ema.js";
import { calcularADX } from "./utils/adx.js";
import { calcularATR } from "./utils/atr.js";
import { calcularSupertrend } from "./utils/supertrend.js";
import { calcularSqueezeMomentum } from "./utils/indicadorsqueeze.js";
import { estructuraGeneral } from "./utils/estructura.js";

let shadowActivo = null;
let shadowIntervalo = "1h";
let shadowBloqueando = false;

// ==========================================================================
// 🟦 LEER ACTIVO ACTUAL DESDE LA BARRA DE ESCANEO
// ==========================================================================
function shadowLeerActivoActual() {
  const el = document.getElementById("estado-escaneo");
  if (!el) return null;

  const texto = el.textContent || "";
  const match = texto.match(/Escaneando:\s*([A-Z0-9\/\.\-]+)\s*–/i);

  if (!match) return null;
  return match[1].trim();
}

// ==========================================================================
// 🟦 LEER INTERVALO REAL DEL ESCÁNER (FOLLOW MODE — OPCIÓN B)
// ==========================================================================
function shadowLeerIntervaloScannerActual() {
  const el = document.getElementById("estado-escaneo");
  if (!el) return "1h";

  const texto = el.textContent || "";

  // Busca: "– 30m", "– 10m", "– 1h", etc.
  const match = texto.match(/–\s*(\d+m|\dh)/i);

  if (!match) return "1h";

  return match[1].toLowerCase();
}

// ==========================================================================
// 🟥 FUNCIÓN PRINCIPAL
// ==========================================================================
export async function cargarDiagnosticoMotor(simbolo, intervalo) {
  if (shadowBloqueando) return;
  shadowBloqueando = true;

  try {
    const estadoEl = document.getElementById("diag-estado");
    const cuerpoEl = document.getElementById("diag-contenido");

    estadoEl.innerText = `Shadow analizando ${simbolo} (${intervalo})…`;

    // ================================================================
    // 1️⃣ OBTENER VELAS REALES DESDE BACKEND
    // ================================================================
    const url = `${import.meta.env.VITE_BACKEND_URL}/diagnostico?simbolo=${simbolo}&intervalo=${intervalo}`;
    const r = await fetch(url);
    const data = await r.json();

    const velas = data?.raw || data?.datos || data?.ohlc?.ultimas || [];

    if (!Array.isArray(velas) || velas.length < 10) {
      cuerpoEl.innerHTML = `<p class="diag-error">No hay suficientes velas para análisis.</p>`;
      estadoEl.innerText = "Shadow sin datos";
      return;
    }

    // ================================================================
    // 2️⃣ CALCULAR INDICADORES (FRONTEND)
    // ================================================================
    const ema30 = calcularEMA(velas, 30).at(-1) || 0;
    const ema65 = calcularEMA(velas, 65).at(-1) || 0;
    const ema200 = calcularEMA(velas, 200).at(-1) || 0;

    const adxArr = calcularADX(velas, 14);
    const adx = adxArr?.at(-1) || 0;

    const atrArr = calcularATR(velas, 14);
    const atr = atrArr?.at(-1) || 0;

    const squeeze = calcularSqueezeMomentum(velas) || null;

    // Supertrend ESTÁNDAR
    const stR = calcularSupertrend(velas, 10, 3).at(-1) || { estado: "OFF", valor: 0 };
    const stL = calcularSupertrend(velas, 20, 6).at(-1) || { estado: "OFF", valor: 0 };

    // Supertrend RIESGO
    const stRR = calcularSupertrend(velas, 7, 2.5).at(-1) || { estado: "OFF", valor: 0 };
    const stRL = calcularSupertrend(velas, 14, 4.5).at(-1) || { estado: "OFF", valor: 0 };

    // Ruptura HL / LH real
    const estructura = estructuraGeneral(velas);
    const ruptura = estructura?.ruptura || "ninguna";
    const distancia = estructura?.distancia || 0;

    // ================================================================
    // 3️⃣ ANALIZAR CALIDAD DEL FEED
    // ================================================================
    const calidad = analizarCalidadVelas(velas);

    // ================================================================
    // 4️⃣ RENDER
    // ================================================================
    cuerpoEl.innerHTML = generarHTMLShadow({
      velas,
      ema30,
      ema65,
      ema200,
      adx,
      atr,
      squeeze,
      stR,
      stL,
      stRR,
      stRL,
      ruptura,
      distancia,
      estructura,
      calidad
    });

    estadoEl.innerText = `Shadow activo – ${simbolo} (${intervalo})`;

  } catch (e) {
    console.error(e);
  } finally {
    shadowBloqueando = false;
  }
}

// ==========================================================================
// 🟦 FUNCION CALIDAD DE VELAS
// ==========================================================================
function analizarCalidadVelas(velas) {
  let sinHigh = 0, sinLow = 0, sinClose = 0, NaNval = 0, errHL = 0;

  for (let v of velas) {
    if (v.high == null) sinHigh++;
    if (v.low == null) sinLow++;
    if (v.close == null) sinClose++;
    if (Number.isNaN(v.high) || Number.isNaN(v.low) || Number.isNaN(v.close)) NaNval++;
    if (v.high < v.low) errHL++;
  }

  return { total: velas.length, sinHigh, sinLow, sinClose, NaNval, errHL };
}

// ==========================================================================
// HTML PRINCIPAL DEL PANEL SHADOW (FUSIÓN 3.5)
// ==========================================================================
function generarHTMLShadow(d) {
  return `
  <div class="shadow-tabs">
    <button id="tab-clean" class="shadow-tab active">CLEAN</button>
    <button id="tab-raw" class="shadow-tab">RAW</button>
    <button id="tab-quality" class="shadow-tab">QUALITY</button>
  </div>

  <!-- ============= CLEAN PANEL =================== -->
  <div id="shadow-clean" class="shadow-panel visible">
    <h4>Condiciones de estrategia vs realidad</h4>
    <table class="diag-tabla">
      <thead>
        <tr><th>Condición</th><th>Requerido</th><th>Actual</th><th>OK</th></tr>
      </thead>
      <tbody>
        ${fila("ADX mínimo", "≥ 10", d.adx.toFixed(2), d.adx >= 10)}
        ${fila("Velas necesarias", "≥ 50", d.velas.length, d.velas.length >= 50)}
        ${fila("ST Riesgo alineado", "Rápido = Lento ≠ OFF",
              `${d.stRR.estado}/${d.stRL.estado}`,
              d.stRR.estado === d.stRL.estado && d.stRR.estado !== "OFF")}
        ${fila("Ruptura swing", "HL_break / LH_break",
              `${d.ruptura} / ${d.distancia.toFixed(2)}`,
              d.ruptura !== "ninguna")}
        ${fila("Estructura institucional",
              "estructuraValida = true",
              d.estructura.estructuraValida ? "Válida" : "NO válida",
              d.estructura.estructuraValida)}
      </tbody>
    </table>
  </div>

  <!-- ============= RAW PANEL =================== -->
  <div id="shadow-raw" class="shadow-panel">
    <h4>Última vela (RAW)</h4>
    <pre class="shadow-raw-box">${JSON.stringify(d.velas.at(-1), null, 2)}</pre>

    <h4>Errores detectados</h4>
    <p>Total velas: ${d.calidad.total}</p>
    <p>Sin HIGH: ${d.calidad.sinHigh}</p>
    <p>Sin LOW: ${d.calidad.sinLow}</p>
    <p>Sin CLOSE: ${d.calidad.sinClose}</p>
    <p>Valores NaN: ${d.calidad.NaNval}</p>
    <p>HIGH < LOW: ${d.calidad.errHL}</p>
  </div>

  <!-- ============= QUALITY PANEL =================== -->
  <div id="shadow-quality" class="shadow-panel">
    <h4>Calidad del feed</h4>
    <p><strong>Total velas:</strong> ${d.calidad.total}</p>
    <p><strong>Errores totales:</strong> ${
      d.calidad.sinHigh +
      d.calidad.sinLow +
      d.calidad.sinClose +
      d.calidad.NaNval +
      d.calidad.errHL
    }</p>
  </div>

  <script>
    document.getElementById("tab-clean").onclick = () => swapTab("clean");
    document.getElementById("tab-raw").onclick = () => swapTab("raw");
    document.getElementById("tab-quality").onclick = () => swapTab("quality");

    function swapTab(tab) {
      document.querySelectorAll(".shadow-tab").forEach(x => x.classList.remove("active"));
      document.querySelector("#tab-" + tab).classList.add("active");

      document.querySelectorAll(".shadow-panel").forEach(x => x.classList.remove("visible"));
      document.querySelector("#shadow-" + tab).classList.add("visible");
    }
  </script>
  `;
}

// ==========================================================================
// FILA UTIL
// ==========================================================================
function fila(cond, req, act, ok) {
  return `
    <tr>
      <td>${cond}</td>
      <td>${req}</td>
      <td>${act}</td>
      <td>${ok ? "✔" : "✘"}</td>
    </tr>
  `;
}

// ==========================================================================
// AUTO-SYNC CON ESCÁNER CADA 4s
// ==========================================================================
setInterval(() => {
  const activo = shadowLeerActivoActual();
  if (!activo) return;

  const tf = shadowLeerIntervaloScannerActual();

  cargarDiagnosticoMotor(activo, tf);
}, 4000);
