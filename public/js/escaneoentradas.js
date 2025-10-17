// === escaneoentradas.js (frontend) ===
// Escaneo automático secuencial en interfaz – versión visual

import { obtenerDatosOHLC } from "./api_twelvedata.js";
import { motorDecisionUltron } from "./motor.js";
import { esHorarioDeMercadoAbierto } from "./utils/sesionmercado.js";
import { activosPorCategoria } from "./watchlist.js";
import { obtenerEstadoEstrategias } from "./switches.js"; // ⚠️ frontend

// 🧩 Lista combinada de activos de la watchlist
const activosSecuenciales = [
  ...(activosPorCategoria.Forex || []),
  ...(activosPorCategoria.Acciones || []),
  ...(activosPorCategoria.Índices || []),
  ...(activosPorCategoria.Criptomonedas || [])
];

let indiceActivoActual = 0;
const intervaloMinutos = 1;

// 🔁 Función principal: escanea un activo cada ciclo
async function escanearSiguienteActivo() {
  const { abierto, session } = esHorarioDeMercadoAbierto();

  if (!abierto) {
    const msg = `⏸️ Mercado cerrado (${session}) – esperando próxima sesión.`;
    actualizarVisual(msg);
    console.log(msg);
    return;
  }

  if (activosSecuenciales.length === 0) return;

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
  actualizarVisual(mensaje);
  console.log(mensaje);

  // 🔍 Obtener datos y aplicar motor
  try {
    const datos = await obtenerDatosOHLC(simbolo);
    if (!datos) {
      console.warn(`⚠️ Sin datos para ${simbolo}`);
    } else {
      motorDecisionUltron(simbolo, datos);
    }
  } catch (error) {
    console.error(`❌ Error escaneando ${simbolo}:`, error.message);
  }

  // Avanzar al siguiente activo en la lista
  indiceActivoActual = (indiceActivoActual + 1) % activosSecuenciales.length;
}

// 🔧 Actualizar mensaje en pantalla
function actualizarVisual(texto) {
  const contenedor = document.getElementById("estado-escaneo");
  if (contenedor) contenedor.textContent = texto;
}

// 🚀 Iniciar ciclo de escaneo automático
escanearSiguienteActivo();
setInterval(escanearSiguienteActivo, intervaloMinutos * 60 * 1000);
