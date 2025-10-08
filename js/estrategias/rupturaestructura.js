// === rupturaestructura.js ===
// Estrategia de Ruptura de Estructura (CHoCH / BOS + Volumen)
// Devuelve si hay entrada válida y tipo de patrón

import { calcularPromedioVolumen, calcularRRsimulado } from "../utils/calculos.js";

export function detectarRupturaEstructura(datos) {
  if (!datos || !datos.datos || !Array.isArray(datos.datos) || datos.datos.length < 20) {
    console.error("❌ Estructura inesperada en datos:", datos);
    return {
      esValida: false,
      tipoEntrada: null,
      rr: null
    };
  }

  const velas = datos.datos;
  const velaActual = velas[velas.length - 1];
  const velaAnterior = velas[velas.length - 2];
  const volumenPromedio = calcularPromedioVolumen(datos.datos.slice(-15));
  const volumenActual = velaActual.volume;

  // === Lógica 1: Ruptura de Alto Anterior (BOS) ===
  const huboRupturaAlcista =
    velaAnterior.high < velaActual.high &&
    volumenActual > volumenPromedio;

  // === Lógica 2: Ruptura de Bajo (CHoCH bajista)
  const huboRupturaBajista =
    velaAnterior.low > velaActual.low &&
    volumenActual > volumenPromedio;

  if (huboRupturaAlcista) {
    return {
      esValida: true,
      tipoEntrada: "BOS Alcista",
      rr: calcularRRsimulado()
    };
  }

  if (huboRupturaBajista) {
    return {
      esValida: true,
      tipoEntrada: "CHoCH Bajista",
      rr: calcularRRsimulado()
    };
  }

 
  return {
    esValida: false,
    tipoEntrada: null,
    rr: null
  };
}
