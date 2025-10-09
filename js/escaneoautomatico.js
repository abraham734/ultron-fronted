// === escaneoautomatico.js ===
// Escaneo automático de 1 activo para mantener activo el sistema y notificar que Ultron está en funcionamiento

import { motorDecisionUltron } from "./motor.js";
import { obtenerDatosOHLC } from "./api_twelvedata.js";
import { enviarNotificacionTelegram } from "./notificaciones.js";
import { actualizarIndicadorEstado } from "./utils/estadosistema.js";

// Escanea un solo activo (por ejemplo, XAUUSD)
async function escanearUnActivo() {
  const simbolo = "XAUUSD"; // Puedes cambiarlo por otro activo relevante
  let estado = "ULTRÓN OPERATIVO";
  let mensajeExtra = "";

  try {
    actualizarIndicadorEstado("verde", "Escaneando 1 activo...");
    console.log(`🔍 Escaneando activo único: ${simbolo}...`);

    const datos = await obtenerDatosOHLC(simbolo);

    if (!datos || !datos.datos || datos.datos.length === 0) {
      console.warn(`⚠️ Datos no disponibles para ${simbolo}`);
      actualizarIndicadorEstado("amarillo", "Sin datos disponibles");
      estado = "⚠️ Sin datos";
      mensajeExtra = "❌ Sin datos disponibles";
    } else {
      motorDecisionUltron(simbolo, datos);
    }

  } catch (error) {
    console.error(`❌ Error al escanear ${simbolo}:`, error);
    actualizarIndicadorEstado("rojo", `Error con ${simbolo}`);
    estado = "❌ Error al escanear";
    mensajeExtra = error.message;
  }

  const hora = new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  // 🟢 Notificación se envía pase lo que pase
  enviarNotificacionTelegram(`📡 Ultron activo. Escaneo realizado a las ${hora}\n${mensajeExtra}`);
  console.log(`📡 Ultron activo. Escaneo único finalizado a las ${hora}`);
  actualizarIndicadorEstado("verde", estado);
}

// Llamada automática cada 30 minutos + uno inicial al cargar
export function iniciarEscaneoAutomatico() {
  escanearUnActivo(); // Escaneo inicial inmediato
  setInterval(() => {
    escanearUnActivo();
  }, 1000 * 60 * 30); // Cada 30 minutos
}
