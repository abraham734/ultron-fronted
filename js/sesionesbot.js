// === sesionesbot.js ===
// Monitorea el cambio de sesión y notifica por Telegram al iniciar una nueva

import { esHorarioDeMercadoAbierto } from "./utils/sesionmercado.js";
import { enviarNotificacionTelegram } from "./notificaciones.js";

// Variable para guardar la última sesión notificada
let ultimaSesionNotificada = null;

export function verificarInicioDeSesion() {
  const { abierto, session } = esHorarioDeMercadoAbierto();

  if (abierto && session && session !== ultimaSesionNotificada) {
    const mensaje = `📣 *Sesión de ${session}* ya está activa.\nUltron inicia escaneo táctico.`;
    enviarNotificacionTelegram(mensaje);
    ultimaSesionNotificada = session;
  }
}

// Reinicia la sesión cada día a las 23:59 (CDMX)
setInterval(() => {
  const ahora = new Date();
  if (ahora.getHours() === 23 && ahora.getMinutes() === 59) {
    ultimaSesionNotificada = null;
  }
}, 1000 * 60); // Revisa cada minuto
