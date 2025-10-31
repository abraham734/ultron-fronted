// === escaneoentradas.js (frontend – escaneo REAL secuencial, 1/min con contador visual) ===
// Recorre los activos uno por minuto y aplica SOLO las estrategias activas
// OFF = ignorada | STANDARD y RIESGO = válidas
// Usa la MISMA barra .barra-escaneo que el análisis manual.

import { activosPorCategoria } from "./watchlist.js";
import { obtenerEstadoEstrategias } from "./switches.js";
import { realizarAnalisis } from "./ultron.js";

// 🧩 Unifica todos los activos en orden secuencial
const activosSecuenciales = [
  ...(activosPorCategoria.Forex || []),
  ...(activosPorCategoria.Acciones || []),
  ...(activosPorCategoria.Índices || []),
  ...(activosPorCategoria.Criptomonedas || []),
];

let indiceActivoActual = 0;
const intervaloMinutos = 1;
let escaneoEnProgreso = false;
let contadorInterval = null;

// 🧷 Asegura que existe una única barra compartida
function getBarraEscaneo() {
  let barra = document.querySelector(".barra-escaneo");
  if (!barra) {
    barra = document.createElement("div");
    barra.classList.add("barra-escaneo");
    const main = document.getElementById("contenedor-activos");
    if (main) main.insertAdjacentElement("beforebegin", barra);
    else document.body.prepend(barra);
  }
  return barra;
}

// 🧠 Determina qué estrategias están realmente activas (STANDARD o RIESGO)
function obtenerEstrategiasActivas() {
  const estados = obtenerEstadoEstrategias();
  const activas = Object.entries(estados)
    .filter(([_, modo]) => modo === "STANDARD" || modo === "RIESGO")
    .map(([nombre, modo]) => {
      switch (nombre) {
        case "cajaDarvas": return `Caja Darvas (${modo})`;
        case "cambioCiclo": return `Reversión Institucional (${modo})`;
        case "tendencia": return `Continuación de Tendencia (${modo})`;
        case "supertrendDoble": return `Supertrend Doble (${modo})`;
        case "emaTriple": return `Triple EMA + ADX (${modo})`;
        default: return `${nombre} (${modo})`;
      }
    });
  return activas;
}

// 🎛️ Inicia cuenta regresiva visual entre escaneos
function iniciarContador(barra, duracionSegundos) {
  let tiempoRestante = duracionSegundos;
  clearInterval(contadorInterval);

  contadorInterval = setInterval(() => {
    tiempoRestante--;
    if (tiempoRestante <= 0) {
      clearInterval(contadorInterval);
      return;
    }
    // Actualiza el texto de la barra sin borrar el nombre del activo
    const textoBase = barra.dataset.textoBase || barra.textContent;
    barra.textContent = `${textoBase} | Próximo en: ${tiempoRestante}s`;
  }, 1000);
}

// 🔁 Escaneo REAL secuencial (uno por minuto)
async function escanearSiguienteActivo() {
  if (escaneoEnProgreso) return;
  if (!activosSecuenciales.length) {
    console.warn("⚠️ No hay activos en la watchlist.");
    getBarraEscaneo().textContent = "⚠️ Sin activos en la lista.";
    return;
  }

  const estrategiasActivas = obtenerEstrategiasActivas();
  if (estrategiasActivas.length === 0) {
    getBarraEscaneo().textContent = "🟡 Esperando... (todas las estrategias en OFF)";
    console.log("🟡 Ciclo pausado: no hay estrategias activas.");
    return;
  }

  escaneoEnProgreso = true;

  try {
    const activo = activosSecuenciales[indiceActivoActual];
    const simbolo = activo.simbolo;
    const barra = getBarraEscaneo();
    const estrategiaSeleccionada = estrategiasActivas[0];

    const textoBase = `🔍 Escaneando: ${simbolo} – Estrategia: ${estrategiaSeleccionada}`;
    barra.textContent = textoBase;
    barra.dataset.textoBase = textoBase;

    console.log(`📊 Escaneando (AUTO): ${simbolo} – ${estrategiaSeleccionada}`);

    // Llamada al backend (misma función que análisis manual)
    await realizarAnalisis(simbolo);

    // Inicia cuenta regresiva hasta el siguiente activo
    iniciarContador(barra, intervaloMinutos * 60);

  } catch (err) {
    console.error("❌ Error en escaneo automático:", err);
    getBarraEscaneo().textContent = `❌ Error de escaneo: ${err?.message || err}`;
  } finally {
    indiceActivoActual = (indiceActivoActual + 1) % activosSecuenciales.length;
    escaneoEnProgreso = false;
  }
}

// 🚀 Disparo inicial + ciclo (1 activo/minuto)
escanearSiguienteActivo();
setInterval(escanearSiguienteActivo, intervaloMinutos * 60 * 1000);
