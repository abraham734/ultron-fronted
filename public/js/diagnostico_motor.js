// === diagnostico_motor.js ===
// Cliente frontend compatible con Shadow Logger V2

const URL_BACKEND = "https://ultron-backend-zvtm.onrender.com";

export async function cargarDiagnosticoMotor(simbolo, intervalo) {
  const contenedor = document.getElementById("ultron-diagnostico");
  const estadoEl = document.getElementById("diag-estado");
  const cuerpoEl = document.getElementById("diag-contenido");

  if (!contenedor || !estadoEl || !cuerpoEl) return;

  estadoEl.textContent = "Obteniendo diagnóstico...";
  cuerpoEl.innerHTML = "";

  try {
    const url = `${URL_BACKEND}/diagnostico?simbolo=${encodeURIComponent(
      simbolo
    )}&intervalo=${encodeURIComponent(intervalo || "30min")}`;

    const resp = await fetch(url);
    const data = await resp.json();

    // ================================
    // 🔥 VALIDACIÓN DE SHADOW V2
    // ================================
    if (!data || !data.estrategias) {
      estadoEl.textContent = "Error en diagnóstico";
      cuerpoEl.innerHTML = `<p class="diag-error">⚠️ Shadow no entregó datos válidos.</p>`;
      return;
    }

    estadoEl.textContent = `Activo: ${data.activo} | Intervalo: ${data.intervalo}`;

    // ================================
    // 🔵 RESUMEN SUPERIOR
    // ================================
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
          <span class="diag-label">Punto corte</span>
          <span class="diag-value diag-corte">
            ${data.puntoCorte?.[0]?.detalle || "Sin corte"}
          </span>
        </div>
        <div>
          <span class="diag-label">Decisión motor</span>
          <span class="diag-value">${data.resultadoFinal?.decision || "-"}</span>
        </div>
        <div>
          <span class="diag-label">Sesión</span>
          <span class="diag-value">${data.resultadoFinal?.session || "-"}</span>
        </div>
        <div>
          <span class="diag-label">Hora</span>
          <span class="diag-value">${new Date(data.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    `;

    // ================================
    // 🟣 TABLA DE ESTRATEGIAS
    // ================================
    const filas = Object.entries(data.estrategias)
      .map(([nombre, info]) => {
        const salida = info.salida || {};
        const esValida = salida.esValida === true ? "Sí" : salida.esValida === false ? "No" : "-";
        const entry = salida.entry ? Number(salida.entry).toFixed(5) : "-";
        const stop = salida.stop ? Number(salida.stop).toFixed(5) : "-";

        return `
        <tr>
          <td>${nombre}</td>
          <td>${esValida}</td>
          <td>${entry}</td>
          <td>${stop}</td>
          <td>${info.error || "-"}</td>
        </tr>`;
      })
      .join("");

    const tablaHtml = `
      <div class="diag-tabla-wrapper">
        <table class="diag-tabla">
          <thead>
            <tr>
              <th>Estrategia</th>
              <th>esValida</th>
              <th>Entry</th>
              <th>Stop</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    `;

    // ================================
    // 🧠 RAZONAMIENTO GLOBAL
    // ================================
    let razonamientoHtml = "";
    if (data.razonamiento?.output) {
      razonamientoHtml = `
        <div class="diag-razonamiento">
          <h4>Razonamiento global</h4>
          <p><strong>Acción:</strong> ${data.razonamiento.output.accion}</p>
          <p><strong>Confianza:</strong> ${(data.razonamiento.output.confianza * 100).toFixed(1)}%</p>
        </div>
      `;
    }

    // ================================
    // 🔧 Render final
    // ================================
    cuerpoEl.innerHTML = resumenHtml + tablaHtml + razonamientoHtml;

  } catch (err) {
    console.error("Error cargando diagnóstico:", err);
    estadoEl.textContent = "Error en diagnóstico";
    cuerpoEl.innerHTML = `<p class="diag-error">❌ Error al conectar con backend Shadow.</p>`;
  }
}
