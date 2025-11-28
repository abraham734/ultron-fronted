// ==========================================================================
// === SHADOW 4.0 – Auditor Real del Motor (Frontend) ========================
// === 100% datos del backend, sin cálculos locales =========================
// ==========================================================================

let shadowBloqueando = false;

// ==========================================================================
// 🟦 LEER ACTIVO DESDE LA BARRA DE ESCANEO
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
// 🟦 LEER INTERVALO DEL ESCÁNER
// ==========================================================================
function shadowLeerIntervaloScannerActual() {
  const el = document.getElementById("estado-escaneo");
  if (!el) return "1h";

  const texto = el.textContent || "";
  const match = texto.match(/–\s*(\d+m|\dh)/i);

  return match ? match[1].toLowerCase() : "1h";
}

// ==========================================================================
// 🟥 FUNCIÓN PRINCIPAL – SOLO BACKEND
// ==========================================================================
export async function cargarDiagnosticoMotor(simbolo, intervalo) {
  if (shadowBloqueando) return;
  shadowBloqueando = true;

  try {
    const estadoEl = document.getElementById("diag-estado");
    const cuerpoEl = document.getElementById("diag-contenido");

    estadoEl.innerText = `Shadow analizando ${simbolo} (${intervalo})…`;

    // ================================================================
    // 1️⃣ OBTENER DATOS REALES DESDE EL BACKEND
    // ================================================================
    const url = `${import.meta.env.VITE_BACKEND_URL}/diagnostico?simbolo=${simbolo}&intervalo=${intervalo}`;
    const r = await fetch(url);
    const data = await r.json();

    if (!data) {
      cuerpoEl.innerHTML = `<p class="diag-error">Sin datos del backend.</p>`;
      estadoEl.innerText = "Shadow sin datos";
      return;
    }

    // ================================================================
    // 2️⃣ EXTRAER DATOS DEL BACKEND (REAL)
    // ================================================================
    const velas = data.velas || []; // <<< ahora sí recibe TODAS las velas
    const ohlc = data.ohlc || {};
    const indicadores = data.indicadores || {};
    const supertrend = data.supertrend || {};
    const estructura = data.estructura || {};
    const ruptura = data.ruptura || {};
    const squeeze = data.squeeze || {};
    const calidad = data.calidad || {};
    const logs = data.logsInternos || [];
    const errores = data.puntoCorte || [];

    // ================================================================
    // Validación mínima
    // ================================================================
    if (!Array.isArray(velas) || velas.length < 2) {
      cuerpoEl.innerHTML = `<p class="diag-error">Backend no envió velas suficientes.</p>`;
      estadoEl.innerText = "Shadow sin datos";
      return;
    }

    // ================================================================
    // 3️⃣ RENDER FINAL
    // ================================================================
    cuerpoEl.innerHTML = generarHTMLShadow({
      velas,
      ohlc,
      indicadores,
      supertrend,
      estructura,
      ruptura,
      squeeze,
      calidad,
      logs,
      errores
    });

    estadoEl.innerText = `Shadow activo – ${simbolo} (${intervalo})`;

  } catch (e) {
    console.error(e);
  } finally {
    shadowBloqueando = false;
  }
}

// ==========================================================================
// HTML PRINCIPAL DEL PANEL SHADOW
// ==========================================================================
function generarHTMLShadow(d) {
  return `
  <div class="shadow-tabs">
    <button id="tab-clean" class="shadow-tab active">CLEAN</button>
    <button id="tab-raw" class="shadow-tab">RAW</button>
    <button id="tab-quality" class="shadow-tab">QUALITY</button>
  </div>

  <!-- CLEAN -->
  <div id="shadow-clean" class="shadow-panel visible">
    <h4>Valores REALES del motor</h4>

    <h4>🟦 Indicadores</h4>
    <pre>${JSON.stringify(d.indicadores, null, 2)}</pre>

    <h4>🟩 Supertrend</h4>
    <pre>${JSON.stringify(d.supertrend, null, 2)}</pre>

    <h4>🟨 Estructura</h4>
    <pre>${JSON.stringify(d.estructura, null, 2)}</pre>

    <h4>🟥 Ruptura</h4>
    <pre>${JSON.stringify(d.ruptura, null, 2)}</pre>
  </div>

  <!-- RAW -->
  <div id="shadow-raw" class="shadow-panel">
    <h4>Velas completas</h4>
    <pre>${JSON.stringify(d.velas, null, 2)}</pre>

    <h4>Última vela</h4>
    <pre>${JSON.stringify(d.ohlc.ultima, null, 2)}</pre>

    <h4>Logs</h4>
    <pre>${JSON.stringify(d.logs, null, 2)}</pre>

    <h4>Errores</h4>
    <pre>${JSON.stringify(d.errores, null, 2)}</pre>
  </div>

  <!-- QUALITY -->
  <div id="shadow-quality" class="shadow-panel">
    <h4>Calidad del Feed</h4>
    <pre>${JSON.stringify(d.calidad, null, 2)}</pre>
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
// AUTO-SYNC CADA 4s
// ==========================================================================
setInterval(() => {
  const activo = shadowLeerActivoActual();
  if (!activo) return;

  const tf = shadowLeerIntervaloScannerActual();
  cargarDiagnosticoMotor(activo, tf);
}, 4000);
