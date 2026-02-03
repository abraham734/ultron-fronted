// === intervalosPorActivo.js ===
// Guarda y recupera el intervalo personalizado por activo
// Estándar Ultron: 30min

const intervalosPorActivo =
  JSON.parse(localStorage.getItem("intervalosUltron")) || {};

// Devuelve el intervalo del activo.
// Si no existe, usa 30min como estándar y lo guarda automáticamente.
export function obtenerIntervaloActivo(simbolo) {
  if (!intervalosPorActivo[simbolo]) {
    intervalosPorActivo[simbolo] = "30min";
    localStorage.setItem(
      "intervalosUltron",
      JSON.stringify(intervalosPorActivo)
    );
  }
  return intervalosPorActivo[simbolo];
}

// Guarda un intervalo personalizado seleccionado por el usuario
export function guardarIntervaloActivo(simbolo, intervalo) {
  intervalosPorActivo[simbolo] = intervalo;
  localStorage.setItem(
    "intervalosUltron",
    JSON.stringify(intervalosPorActivo)
  );
}
