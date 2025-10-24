// === escaneoentradas.js (frontend – escaneo REAL secuencial, 1/min) ===
// Recorre los activos uno por minuto, aplica las estrategias activas y
// usa la MISMA barra .barra-escaneo que el análisis manual.

// Watchlist y switches (para pintar nombres en la barra mientras llega la respuesta)
import { activosPorCategoria } from "./watchlist.js";
import { obtenerEstadoEstrategias } from "./switches.js";

// Usamos la misma función que el análisis manual para no duplicar lógica
import { realizarAnalisis } from "./ultron.js";

// 🧩 Unifica todos los activos por categoría (orden secuencial)
const activosSecuenciales = [
  ...(activosPorCategoria.Forex || []),
  ...(activosPorCategoria.Acciones || []),
  ...(activosPorCategoria.Índices || []),
  ...(activosPorCategoria.Criptomonedas || []),
];

let indiceActivoActual = 0;
const intervaloMinutos = 1;
let escaneoEnProgreso = false;

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

function etiquetasEstrategias() {
  const e = obtenerEstadoEstrategias();
  const activas = [];
  if (e.cajaDarvas) activas.push("Caja Darvas");
  if (e.cambioCiclo) activas.push("Reversión Institucional");
  if (e.tendencia) activas.push("Continuación de Tendencia");
  if (e.supertrendDoble) activas.push("Supertrend Doble");
  return activas.length ? activas.join(", ") : "Sin estrategia activa";
}

// 🔁 Escaneo REAL (await al backend) – uno por minuto
async function escanearSiguienteActivo() {
  if (escaneoEnProgreso) return;
  if (!activosSecuenciales.length) {
    console.warn("⚠️ No hay activos en la watchlist.");
    getBarraEscaneo().textContent = "⚠️ Sin activos en la lista.";
    return;
  }

  escaneoEnProgreso = true;

  try {
    const activo = activosSecuenciales[indiceActivoActual];
    const simbolo = activo.simbolo;
    const textoEstrategias = etiquetasEstrategias();

    // Mensaje intermedio (antes de la respuesta del backend)
    const barra = getBarraEscaneo();
    barra.textContent = `🔍 Escaneando: ${simbolo} – Estrategia: ${textoEstrategias}`;
    console.log(`📊 Escaneando (AUTO): ${simbolo} – ${textoEstrategias}`);

    // 👉 Llama a la MISMA función del análisis manual (envía estrategias y actualiza todo)
    await realizarAnalisis(simbolo);

  } catch (err) {
    console.error("❌ Error en escaneo automático:", err);
    getBarraEscaneo().textContent = `❌ Error de escaneo: ${err?.message || err}`;
  } finally {
    // Avanza al siguiente activo y libera el lock
    indiceActivoActual = (indiceActivoActual + 1) % activosSecuenciales.length;
    escaneoEnProgreso = false;
  }
}

// 🚀 Primer disparo inmediato + intervalo (1/min) SIN solaparse
escanearSiguienteActivo();
setInterval(escanearSiguienteActivo, intervaloMinutos * 60 * 1000);
