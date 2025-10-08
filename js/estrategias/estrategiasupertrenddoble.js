// === estrategiaSupertrendDoble.js ===
// Estrategia Supertrend Doble + Confirmación de Pullback o Doble Piso

import { calcularSupertrend } from "../utils/supertrend.js";
import { calcularRRsimulado } from "../utils/calculos.js";

export function analizarSupertrendDoble(datos) {
  if (!datos || datos.length < 50) {
    return {
      esValida: false,
      tipoEntrada: null,
      niveles: {},
      riesgo: null
    };
  }


  // === Calcular Supertrend rápido y lento
  const stRapido = calcularSupertrend(datos, 10, 3); // ST estándar
  const stLento = calcularSupertrend(datos, 20, 6);  // ST filtro

  const i = datos.length - 1;
  const vela = datos[i];

  const stR = stRapido[i];
  const stL = stLento[i];
  const stRprev = stRapido[i - 1];
  const stLprev = stLento[i - 1];

  // === Validar condiciones de Supertrend
  const ambosBuy = stR.estado === "buy" && stL.estado === "buy";
  const cruceConfirmado = stR.valor > stL.valor && stRprev.valor <= stLprev.valor;

  if (!(ambosBuy && cruceConfirmado)) {
    return {
      esValida: false,
      tipoEntrada: null,
      niveles: {},
      riesgo: null
    };
  }

  // === Confirmación estructural: mínimo creciente o doble piso
  const confirmacionEstructura = validarPullbackEstructural(datos);
  if (!confirmacionEstructura) {
    return {
      esValida: false,
      tipoEntrada: null,
      niveles: {},
      riesgo: null
    };
  }

  // === Calcular SL y TPs
  const precioEntrada = vela.close;
  const sl = stL.valor;
  const tp1 = precioEntrada + (precioEntrada - sl);
  const tp2 = precioEntrada + 2 * (precioEntrada - sl);
  const tp3 = precioEntrada + 3 * (precioEntrada - sl);
  const rr = calcularRRsimulado(sl, tp1);

  return {
    esValida: true,
    tipoEntrada: "Supertrend Doble + Pullback",
    niveles: { sl, tp1, tp2, tp3 },
    riesgo: rr
  };
}

// === estructura.js ===
// Detecta mínimo creciente o doble piso

export function validarPullbackEstructural(datos) {
  if (datos.length < 15) return false;

  const lows = datos.slice(-10).map(v => v.low);
  const min1 = Math.min(...lows.slice(0, 5));
  const min2 = Math.min(...lows.slice(5));

  const diferencia = Math.abs(min1 - min2);
  const umbral = min1 * 0.01;

  const esDoblePiso = diferencia <= umbral;
  const esMinimoCreciente = min2 > min1;

  return esDoblePiso || esMinimoCreciente;
}
