// === diagnostico_motor.js — SHADOW 2.1 (Sincronizado con el escáner) =================
// No toca backend, no toca motor, no toca escáner. Espía invisible y autónomo.
// Lee el activo ACTUAL del escáner y actualiza Shadow en tiempo real.

// =====================================================================================
const URL_BACKEND = "https://ultron-backend-zvtm.onrender.com";

// =====================================================================================
// 🟦 ESPÍA SHADOW: Detecta el activo actual desde la barra de escaneo
// =====================================================================================

// Ejemplo de texto dentro de #estado-escaneo:
//  "📊 Escaneando: BTC/USD – Estrategia: Supertrend Doble (RIESGO)"
function shadowLeerActivoActual() {
  const el = document.getElementById("estado-escaneo");
  if (!el) return null;

  const texto = el.textContent || "";

  // Extraer símbolo entre "Escaneando: " y " –"
  const match = texto.match(/Escaneando:\s*([A-Z0-9\/\.-]+)\s*–/i);
  if (!match) return null;

  return match[1].trim();
}

// =====================================================================================
// 🧠 Inteligencia interna SHADOW (sin tocar motor/estrategias)
// =====================================================================================

function shadowDetectAnticipacion(razones = []) {
  if (!razones.length) return false;
  return razones.some(r =>
    r.includes("Anticipación BUY") || r.includes("Anticipación SELL")
  );
}

function shadowDetectFase(razones = []) {
  if (!razones.length) return "neutra";
  if (razones.some(r => r.includes("Observación"))) return "observacion";
  if (razones.some(r => r.includes("Confirmación completa"))) return "entrada";
  return "neutra";
}

function shadowDetectRuptura(razones = []) {
  const r = razones.find(r => r.includes("Ruptura swing detectada"));
  if (!r) return { tipo: "ninguno", direccion: "-" };

  if (r.includes("HL_break")) return { tipo: "HL_break", direccion: "buy" };
  if (r.includes("LH_break")) return { tipo: "LH_break", direccion: "sell" };

  return { tipo: "ninguno", direccion: "-" };
}

function shadowDetectConfirmacion(razones = []) {
  const r = razones.find(r => r.includes("Confirmación completa"));
  if (!r) return null;
  if (r.includes("BUY")) return "buy";
  if (r.includes("SELL")) return "sell";
  return null;
}

function check(c) {
  return c ? "✔" : "✖";
}

// =====================================================================================
// 🔥 FUNCIÓN PRINCIPAL DE SHADOW — SIEMPRE EN VIVO
// =====================================================================================
export async function cargarDiagnosticoMotor(_simbolo, _intervalo) {
  const cont = document.getElementById("ultron-diagnostico");
  const estadoEl = document.getElementById("diag-estado");
  const cuerpoEl = document.getElementById("diag-contenido");

  if (!cont || !estadoEl || !cuerpoEl) return;

  // Tomamos el activo REAL del escáner
  const simbolo = shadowLeerActivoActual() || _simbolo || "EUR/USD";
  const intervalo = _intervalo || "1h";

  estadoEl.textContent = `Analizando ${simbolo}...`;
  cuerpoEl.innerHTML = "";

  try {
    const url = `${URL_BACKEND}/diagnostico?simbolo=${encodeURIComponent(
      simbolo
    )}&intervalo=${encodeURIComponent(intervalo)}`;

    const resp = await fetch(url);
    const data = await resp.json();

    // =================================================================================
    // EXTRAER DATOS REALES (aunque NO haya salida)
    // =================================================================================
    const stR = data.supertrend?.riesgo?.rapido || {};
    const stL = data.supertrend?.riesgo?.lento || {};

    const adx = data.indicadores?.adx ?? "-";
    const atr = data.indicadores?.atr ?? "-";

    const precioActual = data.ohlc?.ultima?.close ?? "-";
    const velasTotal = data.ohlc?.total ?? "-";

    // Estrategia puede venir vacía, lo manejamos igual
    const salida = data.estrategias?.supertrend_riesgo?.salida || {};
    const razones = salida.razones || [];

    const session =
      salida.session ||
      data.resultadoFinal?.session ||
      "—";

    // =================================================================================
    // SHADOW reconstruye lógica aunque NO haya señal
    // =================================================================================
    const anticipacion = shadowDetectAnticipacion(razones);
    const fase = shadowDetectFase(razones);
    const ruptura = shadowDetectRuptura(razones);
    const confirmacion = shadowDetectConfirmacion(razones);

    // =================================================================================
    // COMPARATIVA ESTRATEGIA vs REALIDAD
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
        actual: velasTotal,
        ok: velasTotal >= 50
      },
      {
        label: "ADX suficiente (>=10)",
        requerido: ">= 10",
        actual: adx !== "-" ? adx.toFixed?.(1) : "-",
        ok: adx >= 10
      },
      {
        label: "ST Rápido",
        requerido: "BUY/SELL según estrategia",
        actual: stR.estado ?? "-",
        ok: stR.estado === salida.bias // coincidencia parcial
      },
      {
        label: "ST Lento",
        requerido: "BUY/SELL según estrategia",
        actual: stL.estado ?? "-",
        ok: stL.estado === salida.bias
      },
      {
        label: "Ruptura swing válida",
        requerido: "HL_break / LH_break",
        actual: ruptura.tipo,
        ok: ruptura.tipo !== "ninguno"
      },
      {
        label: "Anticipación",
        requerido: "TRUE",
        actual: anticipacion,
        ok: anticipacion === true
      },
      {
        label: "Confirmación final",
        requerido: "Coherencia total",
        actual: salida.esValida ? "✔" : "✖",
        ok: salida.esValida === true
      }
    ];

    // =================================================================================
    // RENDER DEL RESUMEN SUPERIOR
    // =================================================================================
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
          <span class="diag-label">Sesión</span>
          <span class="diag-value">${session}</span>
        </div>
        <div>
          <span class="diag-label">ADX</span>
          <span class="diag-value">${adx !== "-" ? adx.toFixed?.(1) : "-"}</span>
        </div>
        <div>
          <span class="diag-label">ATR</span>
          <span class="diag-value">${atr !== "-" ? atr.toFixed?.(5) : "-"}</span>
        </div>
        <div>
          <span class="diag-label">Velas</span>
          <span class="diag-value">${velasTotal}</span>
        </div>
      </div>
    `;

    // =================================================================================
    // RENDER DE LA TABLA COMPARATIVA
    // =================================================================================
    const tablaShadow = `
      <div class="diag-shadow">
        <h3>SHADOW 2.1 — Estrategia vs Realidad (Tiempo Real)</h3>

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

    estadoEl.textContent = `Shadow activo — ${simbolo}`;
    cuerpoEl.innerHTML = resumenHtml + tablaShadow;

  } catch (err) {
    console.error("Error cargando Shadow:", err);
    estadoEl.textContent = "Error en diagnóstico";
    cuerpoEl.innerHTML = `<p class="diag-error">❌ Error al conectar con el backend Shadow.</p>`;
  }
}

// =====================================================================================
// 🔄 SHADOW SIEMPRE SIGUE EL ESCÁNER (1 actualización por ciclo)
// =====================================================================================

setInterval(() => {
  const activo = shadowLeerActivoActual();
  if (activo) {
    cargarDiagnosticoMotor(activo, "1h");
  }
}, 4000); // se actualiza cada 4 segundos para seguir el escáner

