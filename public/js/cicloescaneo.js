// === cicloescaneo.js ===
// Escaneo visual automático cada minuto de todos los activos
// Muestra barra de escaneo en pantalla, aplica estrategias activas

import { activos } from "./data.js";
import { obtenerPrecioDesdeAPI } from "./ultron.js";

let indiceActual = 0;
const intervaloMinutos = 1;

// Crea o actualiza la barra de escaneo
function actualizarBarraEscaneo(simbolo, estrategiasActivas = []) {
  let barra = document.querySelector(".barra-escaneo");

  // Si no existe, la crea
  if (!barra) {
    barra = document.createElement("div");
    barra.classList.add("barra-escaneo");
    const main = document.getElementById("contenedor-activos");
    if (main) {
      main.insertAdjacentElement("beforebegin", barra);
    } else {
      document.body.prepend(barra);
    }
  }

  // Actualiza el contenido
  const estrategiasTexto = estrategiasActivas.length > 0
    ? estrategiasActivas.join(" + ")
    : "Sin estrategias activas";

  barra.textContent = `🔍 Escaneando: ${simbolo} | Estrategias: ${estrategiasTexto}`;
}

// Obtiene estrategias activas desde los switches
function obtenerEstrategiasSeleccionadas() {
  const estrategias = [];
  const switches = document.querySelectorAll(".switch-estrategia input[type='checkbox']");

  switches.forEach((checkbox) => {
    if (checkbox.checked) {
      const label = checkbox.closest(".switch-estrategia")?.querySelector("label");
      if (label) {
        estrategias.push(label.textContent.trim());
      }
    }
  });

  return estrategias;
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
  const estrategiasActivas = obtenerEstrategiasSeleccionadas();

  console.log(`🔁 Escaneando automáticamente: ${simbolo}`);
  actualizarBarraEscaneo(simbolo, estrategiasActivas);
  await obtenerPrecioDesdeAPI(simbolo);

  indiceActual = (indiceActual + 1) % activosSecuenciales.length;
}

// Inicia el ciclo automático
function iniciarCiclo() {
  escanearSiguiente(); // Ejecuta el primero al inicio
  setInterval(escanearSiguiente, intervaloMinutos * 60 * 1000);
}

export { iniciarCiclo };
