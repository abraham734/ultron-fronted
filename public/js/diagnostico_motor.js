// === diagnostico_motor.js — SHADOW 2.2 ============================================
// Espía numérico en tiempo real — NO depende del motor, NO depende de la sesión,
// NO depende de la estrategia. Reporta datos crudos siempre. Totalmente autónomo.

// =====================================================================================
const URL_BACKEND = "https://ultron-backend-zvtm.onrender.com";

// =====================================================================================
// 🟦 ESPÍA: Leer símbolo REAL del escáner (#estado-escaneo)
// =====================================================================================
function shadowLeerActivoActual() {
  const el = document.getElementById("estado-escaneo");
  if (!el) return null;

  const texto = el.textContent || "";
  const match = texto.match(/Escaneando:\s*([A-Z0-9\/\.-]+)\s*–/i);
  if (!match) return null;

  return match[1].trim();
}

// =====================================================================================
// 🧠 INTELIGENCIA INTERNA SHADOW — INDIPENDIENTE DEL MOTOR
// =====================================================================================

// Si falta un número → siempre devolver 0
function num(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

// Detección de rupturas reales con datos crudos (velas), NO del motor
function shadowDetectRupturaCruda(ultima, anterior) {
  if (!ultima || !anterior) {
    return { tipo: "ninguna", direccion: "0", distancia: 0 };
  }

  const highNow = num(ultima.high);
  const lowNow = num(ultima.low);
  const highPrev = num(anterior.high);
  const lowPrev = num(anterior.low);
  const precioActual = num(ultima.close);

  // Ruptura alcista
  if (highNow > highPrev) {
    const distancia = +(precioActual - highPrev).toFixed(2);
    return { tipo: "HL_break", direccion: "BUY", distancia };
  }

  // Ruptura bajista
  if (lowNow < lowPrev) {
    const distancia = +(lowPrev - precioActual).toFixed(2) * -1;
    return { tipo: "LH_break", direccion: "SELL", distancia };
  }

  // Sin ruptura
  return { tipo: "ninguna", direccion: "0", distancia: 0 };
}

// Chequeo ✔ o ✖
function check(c) {
  return c ? "✔" : "✖";
}

// =====================================================================================
// 🟪 FUNCIÓN PRINCIPAL — SHADOW EN TIEMPO REAL (nunca se detiene)
// =====================================================================================
export async function cargarDiagnosticoMotor(_simbolo, _intervalo) {
  const cont = document.getElementById("ultron-diagnostico");
  const estadoEl = document.getElementById("diag-estado");
  const cuerpoEl = document.getElementById("diag-contenido");

  if (!cont || !estadoEl || !cuerpoEl) return;

  // Obtener activo REAL del escáner
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
    // DATOS CRUDOS REALES
    // =================================================================================

    const stR = data.supertrend?.riesgo?.rapido || {};
    const stL = data.supertrend?.riesgo?.lento || {};

    // Supertrend: estado + valor
    const stRapidoEstado = stR.estado || "OFF";
    const stRapidoValor = num(stR.supertrend);
    const stLentoEstado = stL.estado || "OFF";
    const stLentoValor = num(stL.supertrend);

    const precioActual = num(data.ohlc?.ultima?.close);
    const velasTotal = num(data.ohlc?.total);
    const ultima = data.ohlc?.ultima || null;
    const anterior = data.ohlc?.anterior || null; // si no existe, Shadow lo maneja

    const adx = num(data.indicadores?.adx);
    const atr = num(data.indicadores?.atr);

    // Ruptura real del mercado — NO del motor
    const ruptura = shadowDetectRupturaCruda(ultima, anterior);

    // =================================================================================
    // CONDICIONES DE ESTRATEGIA (sin afectar motor)
    // =================================================================================
    const condiciones = [
      {
        label: "ADX >= 10",
        requerido: ">= 10",
        actual: adx,
        ok: adx >= 10
      },
      {
        label: "Velas >= 50",
        requerido: ">= 50",
        actual: velasTotal,
        ok: velasTotal >= 50
      },
      {
        label: "ST Rápido",
        requerido: "Estado/Valor",
        actual: `${stRapidoEstado} / ${stRapidoValor}`,
        ok: true
      },
      {
        label: "ST Lento",
        requerido: "Estado/Valor",
        actual: `${stLentoEstado} / ${stLentoValor}`,
        ok: true
      },
      {
        label: "Ruptura swing",
        requerido: "HL_break / LH_break",
        actual: `${ruptura.tipo} / ${ruptura.direccion} / ${ruptura.distancia}`,
        ok: ruptura.tipo !== "ninguna"
      }
    ];

    // =================================================================================
    // RENDER — RESUMEN SUPERIOR
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
          <span class="diag-label">ADX</span>
          <span class="diag-value">${adx}</span>
        </div>
        <div>
          <span class="diag-label">ATR</span>
          <span class="diag-value">${atr}</span>
        </div>
        <div>
          <span class="diag-label">Ruptura</span>
          <span class="diag-value">${ruptura.tipo}</span>
        </div>
        <div>
          <span class="diag-label">Distancia</span>
          <span class="diag-value">${ruptura.distancia}</span>
        </div>
      </div>
    `;

    // =================================================================================
    // RENDER — TABLA COMPARATIVA
    // =================================================================================
    const tablaShadow = `
      <div class="diag-shadow">
        <h3>SHADOW 2.2 — Datos crudos en tiempo real</h3>

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
// 🔄 SHADOW SIEMPRE SIGUE AL ESCÁNER (tiempo real)
// =====================================================================================
setInterval(() => {
  const activo = shadowLeerActivoActual();
  if (activo) {
    cargarDiagnosticoMotor(activo, "1h");
  }
}, 4000); // actualiza Shadow cada 4 segundos
