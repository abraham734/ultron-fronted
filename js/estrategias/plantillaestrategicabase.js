import { esHorarioDeMercadoAbierto } from "../utils/sesionmercado.js";

/**
 * Estrategia base para análisis táctico automatizado.
 * @param {Array} datos - Arreglo de velas [{ open, high, low, close }]
 * @param {Object} config - Configuración del activo (ej: { tipoActivo: "forex" | "cripto" })
 * @returns {Object} Resultado estandarizado
 */
export function detectarEstrategiaBase(datos, config = { tipoActivo: "forex" }) {
  // === Paso 1: Validación de mercado abierto (sólo para activos 24/5) ===
  const { abierto, sesion } = esHorarioDeMercadoAbierto();

  const esCripto = config.tipoActivo === "cripto";
  if (!esCripto && !abierto) {
    return {
      esValida: false,
      tipoEntrada: null,
      entry: null,
      stop: null,
      takeProfit: null,
      rr: null,
      motivo: "⏳ Fuera del horario operativo para activo 24/5"
    };
  }

  // === Paso 2: Validar datos suficientes ===
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

  // === Paso 3: Aquí va la lógica personalizada de la estrategia ===
  // Simulación de una entrada hipotética
  const entry = datos[datos.length - 1].close;
  const stop = entry - 0.0020;
  const takeProfit = entry + 0.0040;
  const rr = (takeProfit - entry) / (entry - stop);

  return {
    esValida: true,
    tipoEntrada: "Ejemplo Base",
    entry,
    stop,
    takeProfit,
    rr: parseFloat(rr.toFixed(2)),
    sesion
  };
}

export function evaluarEstrategiaBase(datos) {
  // Por ahora solo devuelve esValida = false
  return {
    esValida: false
  };
}
