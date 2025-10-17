// === cicloescaneo.js ===
// Escaneo visual automático cada minuto de todos los activos
// Muestra barra de escaneo en pantalla, aplica estrategias activas

import { activos } from "./data.js";
import { obtenerPrecioDesdeAPI } from "./ultron.js";

let indiceActual = 0;
const intervaloMinutos = 1;

// Crea la barra de escaneo si no existe
function crearBarraEscaneo() {
  let barra = document.querySelector(".barra-escaneo");
  if (!barra) {
    barra = document.createElement("div");
    barra.classList.add("barra-escaneo");
    barra.textContent = "⏳ Iniciando escaneo automático...";
    const main = document.getElementById("contenedor-activos");
    if (main) {
      main.insertAdjacentElement("beforebegin", barra);
    } else {
      document.body.prepend(barra);
    }
  }
}

// Ejecuta escaneo secuencial de un activo
async function escanearSiguiente() {
  const categorias = ["Forex", "Acciones", "Índices", "Criptomonedas"];
  const activosSecuenciales = [];

  // Unifica todos los activos visibles
  for (const categoria of categorias) {
    if (activos[categoria.toLowerCase()]) {
      activosSecuenciales.push(...activos[categoria.toLowerCase()]);
    }
  }

  if (activosSecuenciales.length === 0) {
    console.warn("⚠️ No hay activos disponibles en la watchlist.");
    return;
  }

  const activo = activosSecuenciales[indiceActual];
  const simbolo = activo.simbolo;
  console.log(`🔁 Escaneando automáticamente: ${simbolo}`);
  await obtenerPrecioDesdeAPI(simbolo);

  indiceActual = (indiceActual + 1) % activosSecuenciales.length;
}

// Inicia el ciclo automático
function iniciarCiclo() {
  crearBarraEscaneo();
  escanearSiguiente(); // Ejecuta el primero al inicio
  setInterval(escanearSiguiente, intervaloMinutos * 60 * 1000);
}

// Export para usar en ultron.js o directamente en el index
export { iniciarCiclo };
