import { esHorarioDeMercadoAbierto } from "../utils/sesionmercado.js";


// Estrategia basada en Cajas de Darvas (15M) para detectar rupturas con momentum
export function detectarCajaDarvas(datos, config = { tipoActivo: "forex" }) {
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

  // === Parámetros configurables ===
  const cantidadVelasCaja = 8;
  const toleranciaRangoPorcentaje = 0.02;

  const cajaVelas = datos.slice(-cantidadVelasCaja - 1, -1);
  const maxAlto = Math.max(...cajaVelas.map(vela => vela.high));
  const minBajo = Math.min(...cajaVelas.map(vela => vela.low));

  const rangoPorcentaje = (maxAlto - minBajo) / minBajo;
  if (rangoPorcentaje > toleranciaRangoPorcentaje) {
    return {
      esValida: false,
      tipoEntrada: null,
      entry: null,
      stop: null,
      takeProfit: null,
      rr: null,
      motivo: "📦 No es una caja válida"
    };
  }

  const velaActual = datos[datos.length - 1];
  const rompeAlAlza = velaActual.close > maxAlto;

  const cuerpo = Math.abs(velaActual.close - velaActual.open);
  const mechaTotal = velaActual.high - velaActual.low;
  const proporcionCuerpo = cuerpo / mechaTotal;
  const velaFuerte = proporcionCuerpo > 0.5 && velaActual.close > velaActual.open;

  if (rompeAlAlza && velaFuerte) {
    const entry = velaActual.close;
    const stop = minBajo;
    const alturaCaja = maxAlto - minBajo;
    const takeProfit = entry + alturaCaja;
    const rr = (takeProfit - entry) / (entry - stop);

    return {
      esValida: true,
      tipoEntrada: "Caja Darvas",
      entry,
      stop,
      takeProfit,
      rr: parseFloat(rr.toFixed(2)),
      sesion
    };
  }

  return {
    esValida: false,
    tipoEntrada: null,
    entry: null,
    stop: null,
    takeProfit: null,
    rr: null,
    motivo: "❌ No hay ruptura válida"
  };

}

