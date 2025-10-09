// === motor.js ===
// Motor de Decisión Estratégica ULTRON

import { detectarRupturaEstructura } from "./estrategias/rupturaestructura.js";
import { detectarCambioCiclo } from "./estrategias/estrategiacambiociclo.js";
import { detectarCajaDarvas } from "./estrategias/cajadarvas.js";
import { evaluarEstrategiaBase } from "./estrategias/plantillaestrategicabase.js";
import { analizarSupertrendDoble } from "./estrategias/estrategiasupertrenddoble.js";

import { esHorarioDeMercadoAbierto } from "./utils/sesionmercado.js";
import { enviarNotificacionTelegram } from "./notificaciones.js";
import { registrarEntradaUltron } from "./historial.js";
import { obtenerEstadoEstrategias } from "./switches.js"; // 🟢 Switches activos

export function motorDecisionUltron(simbolo, datosOHLC, tipoActivo = "forex") {
  const resultado = {
    simbolo,
    decision: "NO OPERAR",
    tipoEntrada: null,
    riesgo: "bajo",
    entry: null,
    stop: null,
    takeProfit: null,
    rr: null,
    session: null,
    razones: []
  };

  function procesarEntrada(resultado, activo, estrategiaUsada) {
    let mensaje = `🚨 *Señal Detectada*\nActivo: *${activo}*\nEstrategia: *${estrategiaUsada}*\nDirección: *${resultado.tipoEntrada}*`;

    if (resultado.stop && resultado.takeProfit && resultado.rr) {
      mensaje += `\nSL: ${resultado.stop}\nTP1: ${resultado.takeProfit}\n_Riesgo/Beneficio: ${resultado.rr}_`;
    } else {
      mensaje += `\n⚠️ *Datos incompletos*: SL / TP / RR no calculados aún.`;
    }

    enviarNotificacionTelegram(mensaje);

    const ahora = new Date();
    const fechaHora = ahora.toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    registrarEntradaUltron({
      activo,
      tipoEntrada: resultado.tipoEntrada,
      sl: resultado.stop,
      tp1: resultado.takeProfit,
      tp2: resultado.tp2 || "-",
      tp3: resultado.tp3 || "-",
      fechaHora
    });
  }

  // === BLOQUE 1: Horario global ===
  const { abierto, session } = esHorarioDeMercadoAbierto();
  if (!abierto) {
    resultado.razones.push("🕰️ Fuera del horario ideal (Londres / NY)");
    return resultado;
  }

  // === BLOQUE 2: Ruptura de estructura ===
  const ruptura = detectarRupturaEstructura(datosOHLC);
  if (!ruptura.esValida) {
    resultado.razones.push("📉 No hay ruptura clara de estructura (BOS)");
    return resultado;
  }

  // === BLOQUE 3: Obtener switches activos ===
  const estrategiasActivas = obtenerEstadoEstrategias();

  // === BLOQUE 4: Reversión institucional ===
  if (estrategiasActivas.ciclo) {
    const cambioCiclo = detectarCambioCiclo(datosOHLC);
    if (cambioCiclo.esValida) {
      const entrada = {
        ...resultado,
        decision: "OPERAR",
        tipoEntrada: "Reversión Institucional",
        riesgo: "alto",
        ...cambioCiclo,
        esValida: true
      };
      procesarEntrada(entrada, simbolo, "Reversión Institucional");
      return entrada;
    }
  }

  // === BLOQUE 5: Caja Darvas ===
  if (estrategiasActivas.darvas) {
    const darvas = detectarCajaDarvas(datosOHLC);
    if (darvas.esValida) {
      const entrada = {
        ...resultado,
        decision: "OPERAR",
        tipoEntrada: "Caja Darvas",
        riesgo: "medio",
        ...darvas,
        esValida: true
      };
      procesarEntrada(entrada, simbolo, "Caja Darvas");
      return entrada;
    }
  }

  // === BLOQUE 6: Tendencia Base ===
  if (estrategiasActivas.tendencia) {
    const base = evaluarEstrategiaBase(datosOHLC);
    if (base.esValida) {
      const entrada = {
        ...resultado,
        decision: "OPERAR",
        tipoEntrada: "Continuación de Tendencia",
        riesgo: "medio",
        ...base,
        esValida: true
      };
      procesarEntrada(entrada, simbolo, "Continuación de Tendencia");
      return entrada;
    }
  }

  // === BLOQUE 7: Supertrend Doble + Pullback ===
  if (estrategiasActivas.supertrendDoble) {
    const resultadoSTD = analizarSupertrendDoble(datosOHLC);
    if (resultadoSTD.esValida) {
      const entrada = {
        ...resultado,
        decision: "OPERAR",
        tipoEntrada: "Supertrend Doble + Pullback",
        riesgo: "medio",
        ...resultadoSTD,
        esValida: true
      };
      procesarEntrada(entrada, simbolo, "Supertrend Doble + Pullback");
      return entrada;
    }
  }

  // === BLOQUE FINAL: No se activó nada ===
  resultado.razones.push("❌ No se activó ninguna estrategia (o están apagadas)");
  return resultado;
}
