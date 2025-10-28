// === intervalosPorActivo.js ===
// Guarda y recupera el intervalo personalizado por activo

const intervalosPorActivo = JSON.parse(localStorage.getItem("intervalosUltron")) || {};

export function obtenerIntervaloActivo(simbolo) {
  return intervalosPorActivo[simbolo] || "1h"; // valor por defecto
}

export function guardarIntervaloActivo(simbolo, intervalo) {
  intervalosPorActivo[simbolo] = intervalo;
  localStorage.setItem("intervalosUltron", JSON.stringify(intervalosPorActivo));
}
