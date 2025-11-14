// === diagnostico_motor.js – V4 (Frontend oficial para Shadow V4) ===
// Compatible con motor_test_shadow_v4.js

const URL_BACKEND = "https://ultron-backend-zvtm.onrender.com";

export async function cargarDiagnosticoMotor(simbolo, intervalo) {
  const cont = document.getElementById("ultron-diagnostico");
  const estadoEl = document.getElementById("diag-estado");
  const cuerpoEl = document.getElementById("diag-contenido");

  if (!cont || !estadoEl || !cuerpoEl) return;

  estadoEl.textContent = "Obteniendo diagnóstico...";
  cuerpoEl.innerHTML = "";

  try {
    const url = `${URL_BACKEND}/diagnostico?simbolo=${encodeURIComponent(simbolo)}&intervalo=${encodeURIComponent(intervalo)}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (!data || !data.supertrend || !data.indicadores) {
      estadoEl.textContent = "Error en diagnóstico";
      cuerpoEl.innerHTML = `<p class="diag-error">⚠️ Shadow no entregó datos válidos.</p>`;
      return;
    }

    estadoEl.textContent = `Activo: ${data.activo} | TF: ${data.intervalo}`;

    // =====================================================================================
    // 🟦 RESUMEN SUPERIOR
    // =====================================================================================
    const resumenHtml = `
      <div class="diag-resumen-grid">
        <div>
          <span class="diag-label">Velas</span>
          <span class="diag-value">${data.ohlc?.total ?? "-"}</span>
        </div>

        <div>
          <span class="diag-label">Rango Prom.</span>
          <span class="diag-value">${data.ohlc?.rangoPromedio ?? "-"}</span>
        </div>

        <div>
          <span class="diag-label">Punto de Corte</span>
          <span class="diag-value diag-corte">
            ${data.puntoCorte?.[0]?.detalle ?? "Sin corte"}
          </span>
        </div>

        <div>
          <span class="diag-label">Decisión motor</span>
          <span class="diag-value">${data.resultadoFinal?.decision ?? "-"}</span>
        </div>

        <div>
          <span class="diag-label">Sesión</span>
          <span class="diag-value">${data.resultadoFinal?.session ?? "-"}</span>
        </div>

        <div>
          <span class="diag-label">Hora</span>
          <span class="diag-value">${new Date(data.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    `;

    // =====================================================================================
    // 🟥 BLOQUE DE ESTRUCTURA
    // =====================================================================================
    const e = data.estructura || {};
    const estructuraHtml = `
      <div class="diag-razonamiento">
        <h4>Estructura Institucional</h4>

        <p><strong>BOS:</strong> ${e?.bos?.bos ?? "Sin BOS"}</p>
        <p><strong>Mitigación:</strong> ${e?.mitigacion ? "Sí" : "No"}</p>
        <p><strong>Pullback:</strong> ${e?.pullback ? "Sí" : "No"}</p>
        <p><strong>Validez:</strong> ${e?.estructuraValida ? "Válida" : "No válida"}</p>
      </div>
    `;

    // =====================================================================================
    // 🟩 SUPERTREND REAL (estándar + riesgo)
    // =====================================================================================
    const st = data.supertrend;
    const stHtml = `
      <div class="diag-razonamiento">
        <h4>Supertrend</h4>

        <p><strong>STD Rápido:</strong> (${st.estandar.rapido.estado}) ${st.estandar.rapido.valor?.toFixed(5)}</p>
        <p><strong>STD Lento:</strong>  (${st.estandar.lento.estado}) ${st.estandar.lento.valor?.toFixed(5)}</p>

        <p><strong>Riesgo Rápido:</strong> (${st.riesgo.rapido.estado}) ${st.riesgo.rapido.valor?.toFixed(5)}</p>
        <p><strong>Riesgo Lento:</strong>  (${st.riesgo.lento.estado}) ${st.riesgo.lento.valor?.toFixed(5)}</p>
      </div>
    `;

    // =====================================================================================
    // 🟧 INDICADORES
    // =====================================================================================
    const ind = data.indicadores;
    const indicadoresHtml = `
      <div class="diag-razonamiento">
        <h4>Indicadores</h4>
        <p><strong>EMA 30 / 65 / 200:</strong> ${ind.ema.ema30} / ${ind.ema.ema65} / ${ind.ema.ema200}</p>
        <p><strong>ADX:</strong> ${ind.adx?.toFixed(2)}</p>
        <p><strong>ATR:</strong> ${ind.atr?.toFixed(5)}</p>
        <p><strong>Squeeze:</strong> ${ind.squeeze?.direction ?? "-"}</p>
      </div>
    `;

    // =====================================================================================
    // 🟦 TABLA DE ESTRATEGIAS
    // =====================================================================================
    const filas = Object.entries(data.estrategias)
      .map(([nombre, info]) => {
        const out = info.salida || {};
        const esValida = out.esValida ? "Sí" : "No";
        const entry = out.entry ? Number(out.entry).toFixed(5) : "-";
        const stop = out.stop ? Number(out.stop).toFixed(5) : "-";

        return `
        <tr>
          <td>${nombre}</td>
          <td>${esValida}</td>
          <td>${entry}</td>
          <td>${stop}</td>
          <td>${info.error ?? "-"}</td>
        </tr>`;
      })
      .join("");

    const tablaHtml = `
      <div class="diag-tabla-wrapper">
        <table class="diag-tabla">
          <thead>
            <tr>
              <th>Estrategia</th>
              <th>Valida</th>
              <th>Entry</th>
              <th>Stop</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    `;

    // =====================================================================================
    // 🔵 RAZONAMIENTO GLOBAL (Modo V4)
    // =====================================================================================
    let razonamientoHtml = "";
    if (data.resultadoFinal?.razones) {
      razonamientoHtml = `
        <div class="diag-razonamiento">
          <h4>Motor – Razones</h4>
          ${data.resultadoFinal.razones.map(r => `<p>• ${r}</p>`).join("")}
        </div>
      `;
    }

    // =====================================================================================
    // 🔥 Render Final
    // =====================================================================================
    cuerpoEl.innerHTML =
      resumenHtml +
      estructuraHtml +
      stHtml +
      indicadoresHtml +
      tablaHtml +
      razonamientoHtml;

  } catch (err) {
    console.error("Error cargando diagnóstico:", err);
    estadoEl.textContent = "Error en diagnóstico";
    cuerpoEl.innerHTML = `<p class="diag-error">❌ Error al conectar con backend Shadow.</p>`;
  }
}
