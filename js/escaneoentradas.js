import { obtenerDatosOHLC } from "./api_twelvedata.js";
import { motorDecisionUltron } from "./motor.js";
import { esHorarioDeMercadoAbierto } from "./utils/sesionmercado.js";
import { activosPorCategoria } from "./watchlist.js";
import { obtenerEstadoEstrategias } from "./switches.js"; // ⬅️ para detectar qué está activo

const activosSecuenciales = [
  ...activosPorCategoria.Forex,
  ...activosPorCategoria.Acciones,
  ...activosPorCategoria.Índices,
  ...activosPorCategoria.Criptomonedas || []
];

let indiceActivoActual = 0;
const intervaloMinutos = 1;

async function escanearSiguienteActivo() {
  const { abierto, session } = esHorarioDeMercadoAbierto();
  if (!abierto) {
    console.log("🕒 Mercado cerrado – esperando próxima sesión.");
    actualizarVisual("⏸️ Mercado cerrado – esperando próxima sesión.");
    return;
  }

  if (activosSecuenciales.length === 0) return;

  const activo = activosSecuenciales[indiceActivoActual];
  const simbolo = activo.simbolo;

  // Detectar estrategia activa (solo mostramos la primera que esté activa)
   const estrategias = obtenerEstadoEstrategias();
  const estrategiasActivas = [];

  if (estrategias.supertrendDoble) estrategiasActivas.push("Supertrend Doble");
  if (estrategias.ciclo) estrategiasActivas.push("Reversión Institucional");
  if (estrategias.darvas) estrategiasActivas.push("Caja Darvas");
  if (estrategias.tendencia) estrategiasActivas.push("Continuación de Tendencia");

  const estrategiaTexto = estrategiasActivas.length > 0
    ? `Estrategias: ${estrategiasActivas.join(", ")}`
    : "Sin estrategia activa";


  // Mostrar en consola y en pantalla
  const mensaje = `📊 Escaneando: ${simbolo} – ${estrategiaTexto}`;
  console.log(mensaje);
  actualizarVisual(mensaje);

  try {
    const datos = await obtenerDatosOHLC(simbolo);
    if (!datos) {
      console.warn(`⚠️ Sin datos para ${simbolo}`);
    } else {
      motorDecisionUltron(simbolo, datos);
    }
  } catch (error) {
    console.error(`❌ Error escaneando ${simbolo}:`, error);
  }

  // Avanzar al siguiente activo
  indiceActivoActual = (indiceActivoActual + 1) % activosSecuenciales.length;
}

// Actualizar mensaje en pantalla
function actualizarVisual(texto) {
  const contenedor = document.getElementById("estado-escaneo");
  if (contenedor) contenedor.textContent = texto;
}

escanearSiguienteActivo();
setInterval(escanearSiguienteActivo, intervaloMinutos * 60 * 1000);
