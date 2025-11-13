// === diagnostico_motor.js ===
// Cliente frontend para mostrar el diagnóstico interno del motor Ultron

const URL_BACKEND = "https://ultron-backend-zvtm.onrender.com"; // ajusta si tu URL cambió

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

    if (!data.ok) {
      estadoEl.textContent = "Error en diagnóstico";
      cuerpoEl.innerHTML = `<p class="diag-error">⚠️ ${data.motivo || data.error || "No se pudo obtener información del motor."}</p>`;
      return;
    }

    const { resumen, estrategias, razonamiento } = data;

    estadoEl.textContent = `Activo: ${resumen.activo} | Intervalo: ${resumen.intervalo}`;

    // Resumen superior
    const resumenHtml = `
      <div class="diag-resumen-grid">
        <div>
          <span class="diag-label">Precio actual</span>
          <span class="diag-value">$${resumen.precioActual ?? "-"}</span>
        </div>
        <div>
          <span class="diag-label">Velas procesadas</span>
          <span class="diag-value">${resumen.velas}</span>
        </div>
        <div>
          <span class="diag-label">Decisión final</span>
          <span class="diag-value">${resumen.decisionFinal}</span>
        </div>
        <div>
          <span class="diag-label">Tipo de entrada</span>
          <span class="diag-value">${resumen.tipoEntrada || "-"}</span>
        </div>
        <div>
          <span class="diag-label">Sesión</span>
          <span class="diag-value">${resumen.sesion || "-"}</span>
        </div>
        <div>
          <span class="diag-label">Punto de corte</span>
          <span class="diag-value diag-corte">${
            resumen.puntoCorte || "Sin corte aparente"
          }</span>
        </div>
      </div>
    `;

    // Tabla de estrategias
    const filas = Object.entries(estrategias)
      .map(([nombre, info]) => {
        const estado = info.estado || "NO EJECUTADA";
        const esValida =
          info.esValida === true ? "Sí" : info.esValida === false ? "No" : "-";
        const entry =
          info.entry != null ? Number(info.entry).toFixed(5) : "-";
        const stop = info.stop != null ? Number(info.stop).toFixed(5) : "-";
        const llamadas = info.llamadas ? info.llamadas.length : 0;
        const error = info.error || (info.llamadas && info.llamadas[0]?.error) || "";

        return `
        <tr>
          <td>${nombre}</td>
          <td>${estado}</td>
          <td>${esValida}</td>
          <td>${entry}</td>
          <td>${stop}</td>
          <td>${llamadas}</td>
          <td>${error || "-"}</td>
        </tr>`;
      })
      .join("");

    const tablaHtml = `
      <div class="diag-tabla-wrapper">
        <table class="diag-tabla">
          <thead>
            <tr>
              <th>Estrategia</th>
              <th>Estado</th>
              <th>esValida</th>
              <th>Entry</th>
              <th>Stop</th>
              <th>Llamadas</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            ${filas}
          </tbody>
        </table>
      </div>
    `;

    // Bloque de razonamiento
    let razonamientoHtml = "";
    if (razonamiento && razonamiento.output) {
      razonamientoHtml = `
        <div class="diag-razonamiento">
          <h4>Razonamiento global</h4>
          <p><strong>Acción:</strong> ${razonamiento.output.accion}</p>
          <p><strong>Confianza:</strong> ${
            (razonamiento.output.confianza * 100).toFixed(1)
          }%</p>
        </div>
      `;
    }

    cuerpoEl.innerHTML = resumenHtml + tablaHtml + razonamientoHtml;
  } catch (err) {
    console.error("Error cargando diagnóstico:", err);
    estadoEl.textContent = "Error en diagnóstico";
    cuerpoEl.innerHTML = `<p class="diag-error">❌ Error al conectar con el backend de diagnóstico.</p>`;
  }
}
