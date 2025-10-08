// === estrategiaCambioCiclo.js ===
// Estrategia institucional de cambio de ciclo: BOS + OB + Liquidez + Fibo + Vela fuerte

import { esHorarioDeMercadoAbierto } from "../utils/sesionmercado.js";

/**
 * Detecta cambio institucional de ciclo de mercado en activos 24/5 o 24/7
 * @param {Array} datos - Velas [{ open, high, low, close }]
 * @param {Object} config - { tipoActivo: "forex" | "cripto" }
 * @returns {Object} Resultado del análisis
 */
export function detectarCambioCiclo(datos, config = { tipoActivo: "forex" }) {
  const esCripto = config.tipoActivo === "cripto";
  const { abierto, sesion } = esHorarioDeMercadoAbierto();

  if (!esCripto && !abierto) {
    return {
      esValida: false,
      tipoEntrada: null,
      entry: null,
      stop: null,
      takeProfit: null,
      rr: null,
      motivo: "⏳ Fuera del horario operativo"
    };
  }

  if (!datos || datos.length < 20) {
    return {
      esValida: false,
      tipoEntrada: null,
      entry: null,
      stop: null,
      takeProfit: null,
      rr: null,
      motivo: "📉 No hay suficientes velas"
    };
  }

  // === Paso 1: Detectar BOS (Break of Structure alcista)
  const velaAnterior = datos[datos.length - 2];
  const velaActual = datos[datos.length - 1];

  const altoPrevio = Math.max(...datos.slice(-6, -1).map(v => v.high));
  const rompimiento = velaActual.close > altoPrevio;

  if (!rompimiento) {
    return {
      esValida: false,
      tipoEntrada: null,
      entry: null,
      stop: null,
      takeProfit: null,
      rr: null,
      motivo: "❌ No hay ruptura clara de estructura (BOS)"
    };
  }

  // === Paso 2: Order Block (mínimo de la vela que causó el rompimiento)
  const orderBlock = Math.min(velaAnterior.open, velaAnterior.close);

  // === Paso 3: Validar retroceso hacia OB entre 0.5 - 0.618 (Fibonacci)
  const impulso = velaActual.close - orderBlock;
  const fibo_618 = velaActual.close - impulso * 0.618;
  const fibo_50 = velaActual.close - impulso * 0.5;

  // Validamos que el OB esté entre esas zonas (condición simple)
  const obEnZona = orderBlock >= fibo_618 && orderBlock <= fibo_50;

  if (!obEnZona) {
    return {
      esValida: false,
      tipoEntrada: null,
      entry: null,
      stop: null,
      takeProfit: null,
      rr: null,
      motivo: "📏 El Order Block no está en zona óptima (Fibo 0.5 – 0.618)"
    };
  }

  // === Paso 4: Confirmación con vela envolvente alcista (simple)
  const cuerpoActual = Math.abs(velaActual.close - velaActual.open);
  const cuerpoPrevio = Math.abs(velaAnterior.close - velaAnterior.open);
  const envolvente = velaActual.close > velaAnterior.open && cuerpoActual > cuerpoPrevio;

  if (!envolvente) {
    return {
      esValida: false,
      tipoEntrada: null,
      entry: null,
      stop: null,
      takeProfit: null,
      rr: null,
      motivo: "📉 No hay vela envolvente confirmadora"
    };
  }

  // === Paso 5: Calcular entrada, SL y TP
  const entry = velaActual.close;
  const stop = orderBlock;
  const takeProfit = entry + (entry - stop) * 2; // RR 2:1
  const rr = (takeProfit - entry) / (entry - stop);

  return {
    esValida: true,
    tipoEntrada: "Cambio de Ciclo Institucional",
    entry,
    stop,
    takeProfit,
    rr: parseFloat(rr.toFixed(2)),
    sesion
  };
}

