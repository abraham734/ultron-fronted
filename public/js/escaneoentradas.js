// === escaneoentradas.js (frontend – solo visual) ===
// Muestra visualmente el estado del escaneo secuencial sin lógica de análisis

import { activosPorCategoria } from "./watchlist.js";
import { obtenerEstadoEstrategias } from "./switches.js";

// 🧩 Unifica todos los activos por categoría
const activosSecuenciales = [
  ...(activosPorCategoria.Forex || []),
  ...(activosPorCategoria.Acciones || []),
  ...(activosPorCategoria.Índices || []),
  ...(activosPorCategoria.Criptomonedas || [])
];

let indiceActivoActual = 0;
const intervaloMinutos = 1;

// 🔁 Función principal visual: solo recorre y actualiza barra
function escanearVisualmenteSiguienteActivo() {
  if (activosSecuenciales.length === 0) {
    console.warn("⚠️ No hay activos disponibles en la watchlist.");
    actualizarVisual("⚠️ Sin activos en la lista.");
    return;
  }

  const activo = activosSecuenciales[indiceActivoActual];
  const simbolo = activo.simbolo;

  // 🧠 Detectar estrategias activas
  const estrategias = obtenerEstadoEstrategias();
  const estrategiasActivas = [];

  if (estrategias.supertrendDoble) estrategiasActivas.push("Supertrend Doble");
  if (estrategias.ciclo) estrategiasActivas.push("Reversión Institucional");
  if (estrategias.darvas) estrategiasActivas.push("Caja Darvas");
  if (estrategias.tendencia) estrategiasActivas.push("Continuación de Tendencia");

  const estrategiaTexto = estrategiasActivas.length > 0
    ? `Estrategias: ${estrategiasActivas.join(", ")}`
    : "Sin estrategia activa";

  const mensaje = `📊 Escaneando: ${simbolo} – ${estrategiaTexto}`;
  console.log(mensaje);
  actualizarVisual(mensaje);

  // Avanza al siguiente activo
  indiceActivoActual = (indiceActivoActual + 1) % activosSecuenciales.length;
}

// 🔧 Actualiza visualmente el DOM
function actualizarVisual(texto) {
  const contenedor = document.getElementById("estado-escaneo");
  if (contenedor) contenedor.textContent = texto;
}

// 🚀 Iniciar escaneo visual cada minuto
escanearVisualmenteSiguienteActivo();
setInterval(escanearVisualmenteSiguienteActivo, intervaloMinutos * 60 * 1000);
