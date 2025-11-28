// === diagnostico_motor.js — SHADOW 2.0 (Estrategia vs Realidad) ======================
// ULTRON SHADOW COMPARATOR — No toca backend, no modifica motor, no agrega imports
// Toda la lógica está encapsulada dentro de este archivo. Solo observa.

// =====================================================================================
const URL_BACKEND = "https://ultron-backend-zvtm.onrender.com";

// =====================================================================================
// 🔧 Funciones internas de análisis Shadow (ESPÍA INTERNO)
// =====================================================================================

// Detecta anticipación basada en las razones de la estrategia
function shadowDetectAnticipacion(razones = []) {
  if (!razones.length) return false;
  return razones.some(r =>
    r.includes("Anticipación BUY") || r.includes("Anticipación SELL")
  );
}

// Detecta fase (observación / entrada / neutra)
function shadowDetectFase(razones = []) {
  if (!razones.length) return "neutra";
  if (razones.some(r => r.includes("Observación"))) return "observacion";
  if (razones.some(r => r.includes("Confirmación completa"))) return "entrada";
  return "neutra";
}

// Detecta ruptura de swing (HL_break / LH_break)
function shadowDetectRuptura(razones = []) {
  const r = razones.find(r => r.includes("Ruptura swing detectada"));
  if (!r) return { tipo: "ninguno", direccion: "-" };

  if (r.includes("HL_break")) return { tipo: "HL_break", direccion: "buy" };
  if (r.includes("LH_break")) return { tipo: "LH_break", direccion: "sell" };

  return { tipo: "ninguno", direccion: "-" };
}

// Extrae confirmación final (BUY / SELL)
function shadowDetectConfirmacion(razones = []) {
  const r = razones.find(r => r.includes("Confirmación completa"));
  if (!r) return null;
  if (r.includes("BUY")) return "buy";
  if (r.includes("SELL")) return "sell";
  return null;
}

// Helper para ✔ / ✖
function check(cond) {
  return cond ? "✔" : "✖";
}

// =====================================================================================
// 🟦 FUNCIÓN PRINCIPAL — SHADOW 2.0
// =====================================================================================
export async function cargarDiagnosticoMotor(simbolo, intervalo) {
  const cont = document.getElementById("ultron-diagnostico");
  const estadoEl = document.getElementById("diag-estado");
  const cuerpoEl = document.getElementById("diag-contenido");

  if (!cont || !estadoEl || !cuerpoEl) return;

  estadoEl.textContent = "Obteniendo diagnóstico...";
  cuerpoEl.innerHTML = "";

  try {
    const url = `${URL_BACKEND}/diagnostico?simbolo=${encodeURIComponent(
      simbolo
    )}&intervalo=${encodeURIComponent(intervalo)}`;

    const resp = await fetch(url);
    const data = await resp.json();

    // =================================================================================
    // Validar datos
    // =================================================================================
    if (!data || !data.estrategias?.supertrend_riesgo?.salida) {
      estadoEl.textContent = "Error en diagnóstico";
      cuerpoEl.innerHTML =
        `<p class="diag-error">⚠️ Shadow no entregó datos válidos.</p>`;
      return;
    }

    const salida = data.estrategias.supertrend_riesgo.salida;
    const razones = salida.razones || [];

    // =================================================================================
    // EXTRAER VALORES REALES DESDE SHADOW
    // =================================================================================
    const stR = data.supertrend?.riesgo?.rapido || {};
    const stL = data.supertrend?.riesgo?.lento || {};

    const adx = data.indicadores?.adx ?? null;
    const atr = data.indicadores?.atr ?? null;

    const ohlc = data.ohlc?.ultima || {};
    const precioActual = ohlc.close ?? "-";

    const session = salida.session ?? data.resultadoFinal?.session ?? "-";

    // =================================================================================
    // INTELIGENCIA SHADOW (sin tocar estrategia ni motor)
    // =================================================================================
    const anticipacion = shadowDetectAnticipacion(razones);
    const fase = shadowDetectFase(razones);
    const ruptura = shadowDetectRuptura(razones);
    const confirmacion = shadowDetectConfirmacion(razones);

    // =================================================================================
    // COMPARATIVA – Condiciones reales vs estrategia
    // =================================================================================

    const condiciones = [
      {
        label: "Mercado abierto",
        requerido: "Abierto",
        actual: session,
        ok: session !== "Cerrado"
      },
      {
        label: "Mínimo 50 velas",
        requerido: ">= 50",
        actual: data.ohlc?.total ?? "-",
        ok: (data.ohlc?.total ?? 0) >= 50
      },
      {
        label: "ADX suficiente (>=10)",
        requerido: ">= 10",
        actual: adx?.toFixed?.(1) ?? "-",
        ok: adx >= 10
      },
      {
        label: "ST Rápido debe coincidir con dirección",
        requerido: "(BUY/SELL)",
        actual: stR.estado ?? "-",
        ok: true // no bloquear, se evalúa en confirmación final
      },
      {
        label: "ST Lento debe coincidir con dirección",
        requerido: "(BUY/SELL)",
        actual: stL.estado ?? "-",
        ok: true
      },
      {
        label: "Anticipación activada",
        requerido: "TRUE",
        actual: anticipacion,
        ok: anticipacion === true
      },
      {
        label: "Ruptura swing válida",
        requerido: "HL_break / LH_break",
        actual: ruptura.tipo,
        ok: ruptura.tipo !== "ninguno"
      },
      {
        label: "Confirmación final",
        requerido: "Coherencia total",
        actual: confirmacion ?? "—",
        ok: salida.esValida === true
      },
      {
        label: "RR mínimo (>=1.0)",
        requerido: ">= 1.0",
        actual: salida.rr ?? "-",
        ok: salida.rr >= 1.0
      }
    ];

    // =================================================================================
    // RENDER: TABLA COMPARATIVA
    // =================================================================================
    const tablaShadow = `
      <div class="diag-shadow">
        <h3>SHADOW 2.0 — Estrategia vs Realidad</h3>

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

    // =================================================================================
    // RENDER RESUMEN SUPERIOR
    // =================================================================================
    const resumenHtml = `
      <div class="diag-resumen-grid">
        <div>
          <span class="diag-label">Velas</span>
          <span class="diag-value">${data.ohlc?.total ?? "-"}</span>
        </div>

        <div>
          <span class="diag-label">Sesión</span>
          <span class="diag-value">${session}</span>
        </div>

        <div>
          <span class="diag-label">Precio actual</span>
          <span class="diag-value">${precioActual}</span>
        </div>

        <div>
          <span class="diag-label">ADX</span>
          <span class="diag-value">${adx?.toFixed?.(1) ?? "-"}</span>
        </div>

        <div>
          <span class="diag-label">ATR</span>
          <span class="diag-value">${atr?.toFixed?.(5) ?? "-"}</span>
        </div>

        <div>
          <span class="diag-label">Confirmación</span>
          <span class="diag-value">${salida.esValida ? "✔" : "✖"}</span>
        </div>
      </div>
    `;

    // =================================================================================
    // RENDER FINAL
    // =================================================================================
    estadoEl.textContent = `SHADOW 2.0 — ${simbolo} (${intervalo})`;
    cuerpoEl.innerHTML = resumenHtml + tablaShadow;

  } catch (err) {
    console.error("Error cargando diagnóstico:", err);
    estadoEl.textContent = "Error en diagnóstico";
    cuerpoEl.innerHTML = `<p class="diag-error">❌ Error al conectar con backend Shadow.</p>`;
  }
}
