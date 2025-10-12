// === configuracionrapida.js ===
// Módulo para renderizar y calcular tamaño de lote según riesgo personal

export function renderConfiguracionRapida(simbolo, precio) {
  return `
    <div class="bloque-config">
      <h4>⚙️ Configuración Rápida</h4>

      <div class="campo">
        <label for="input-capital">💰 Capital disponible</label>
        <input type="number" id="input-capital" placeholder="Ej: 1000">
      </div>

      <div class="campo">
        <label for="input-riesgo">🎯 Riesgo (%)</label>
        <input type="number" id="input-riesgo" placeholder="Ej: 2">
      </div>

      <div class="campo">
        <label for="input-apalancamiento">📏 Apalancamiento</label>
        <input type="number" id="input-apalancamiento" placeholder="Ej: 200" value="200">
      </div>

      <div class="campo-dinamico">
        <label>Stop Loss (SL)</label>
        <p id="sl-texto">⏳ Esperando señal activa...</p>
      </div>

      <div class="campo-dinamico">
        <label>Take Profits</label>
        <p id="tp1-texto">⏳ Esperando señal activa...</p>
        <p id="tp2-texto">⏳ Esperando señal activa...</p>
        <p id="tp3-texto">⏳ Esperando señal activa...</p>
      </div>

      <button id="boton-calcular-lote">Calcular Tamaño de Lote</button>
      <div id="resultado-lote" class="resultado-config"></div>
    </div>
  `;
}

export function configurarEventoCalculo(simbolo, precioEntrada) {
  const inputCapital = document.getElementById("input-capital");
  const inputRiesgo = document.getElementById("input-riesgo");
  const inputApalancamiento = document.getElementById("input-apalancamiento");
  const botonCalcular = document.getElementById("boton-calcular-lote");
  const resultadoDiv = document.getElementById("resultado-lote");

  const sl = obtenerStopLoss();
  mostrarSLyTPs();

  botonCalcular.addEventListener("click", () => {
    const capital = parseFloat(inputCapital.value);
    const riesgoPorcentaje = parseFloat(inputRiesgo.value);
    const apalancamiento = parseFloat(inputApalancamiento.value);

    if (isNaN(capital) || isNaN(riesgoPorcentaje) || isNaN(apalancamiento)) {
      resultadoDiv.innerHTML = `<p class="error">❌ Llena todos los campos correctamente.</p>`;
      return;
    }

    if (!sl || !precioEntrada || precioEntrada === sl) {
      resultadoDiv.innerHTML = `<p class="error">⚠️ Esperando señal activa con SL válido.</p>`;
      return;
    }

    const riesgoUSD = (capital * riesgoPorcentaje) / 100;
    const distancia = Math.abs(precioEntrada - sl);
    const valorPorUnidad = distancia / apalancamiento;
    const unidades = riesgoUSD / valorPorUnidad;

    resultadoDiv.innerHTML = `
      <p>💰 <strong>Capital:</strong> $${capital.toFixed(2)}</p>
      <p>🎯 <strong>Riesgo:</strong> ${riesgoPorcentaje}% → $${riesgoUSD.toFixed(2)}</p>
      <p>📉 <strong>Distancia SL:</strong> ${distancia.toFixed(2)} puntos</p>
      <p>📏 <strong>Apalancamiento:</strong> ${apalancamiento}x</p>
      <p class="resultado">📦 <strong>Lote sugerido:</strong> ${unidades.toFixed(2)} unidades</p>
    `;
  });
}

function obtenerStopLoss() {
  const nodo = document.querySelector("#sl-actual");
  if (!nodo) return null;
  const valor = parseFloat(nodo.textContent.replace(/[^\d.\-]/g, ""));
  return isNaN(valor) ? null : valor;
}

export function mostrarSLyTPs(datos = {}) {
  const {
    slTexto = "⏳ Esperando señal activa...",
    tp1Texto = "⏳ Esperando señal activa...",
    tp2Texto = "⏳ Esperando señal activa...",
    tp3Texto = "⏳ Esperando señal activa..."
  } = datos;

  const slElemento = document.getElementById("sl-texto");
  const tp1Elemento = document.getElementById("tp1-texto");
  const tp2Elemento = document.getElementById("tp2-texto");
  const tp3Elemento = document.getElementById("tp3-texto");

  if (!slElemento || !tp1Elemento || !tp2Elemento || !tp3Elemento) return;

  slElemento.textContent = slTexto;
  tp1Elemento.textContent = tp1Texto;
  tp2Elemento.textContent = tp2Texto;
  tp3Elemento.textContent = tp3Texto;
}

