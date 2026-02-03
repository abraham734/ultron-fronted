// === watchlist.js ===
// Panel lateral de activos (tipo TradingView) con conexión directa al flujo de análisis principal
// Versión táctica 02/feb/2026 – optimizada para plan gratuito TwelveData
// Lista alineada con backend activos.js (sin símbolos removidos)

import { realizarAnalisis } from "./ultron.js"; // ✅ usa el mismo flujo POST oficial

// === Categorías y activos ===
export const activosPorCategoria = {
  Forex: [
    { nombre: "Euro / Dólar", simbolo: "EUR/USD" },
    { nombre: "Oro / Dólar", simbolo: "XAU/USD" },
    { nombre: "Dólar / Yen Japonés", simbolo: "USD/JPY" },
    { nombre: "Dólar / Peso Mexicano", simbolo: "USD/MXN" }
  ],

  Acciones: [
    // Core estructuradas
    { nombre: "Apple", simbolo: "AAPL" },
    { nombre: "Google", simbolo: "GOOG" },
    { nombre: "Meta Platforms", simbolo: "META" },

    // Defensivas (cabras)
    { nombre: "Procter & Gamble", simbolo: "PG" },
    { nombre: "Johnson & Johnson", simbolo: "JNJ" },
    { nombre: "McDonald's", simbolo: "MCD" },
    { nombre: "Coca-Cola", simbolo: "KO" },
    { nombre: "PepsiCo", simbolo: "PEP" }
  ],

  Índices: [
    { nombre: "Financiero (XLF)", simbolo: "XLF" },
    { nombre: "Consumo Básico (XLP)", simbolo: "XLP" },
    { nombre: "Russell 2000 (IWM)", simbolo: "IWM" },
    { nombre: "DAX (DAX)", simbolo: "DAX" }
  ],

  Criptomonedas: [
    { nombre: "Bitcoin", simbolo: "BTC/USD" },
    { nombre: "Ethereum", simbolo: "ETH/USD" },
    { nombre: "Solana", simbolo: "SOL/USD" }
  ]
};

// === Render principal ===
export function renderWatchlist() {
  const panel = document.querySelector(".watchlist-panel");
  if (!panel) return;

  // Limpia contenido previo
  panel.innerHTML = "";

  for (const categoria in activosPorCategoria) {
    const seccion = document.createElement("div");
    seccion.className = "watchlist-seccion";

    const titulo = document.createElement("h3");
    titulo.textContent = categoria;
    titulo.className = "watchlist-titulo";
    seccion.appendChild(titulo);

    // === Renderiza cada botón de activo ===
    activosPorCategoria[categoria].forEach((activo) => {
      const btn = document.createElement("button");
      btn.className = "watchlist-boton";
      btn.textContent = activo.nombre;
      btn.dataset.simbolo = activo.simbolo;

      btn.addEventListener("click", async () => {
        try {
          console.log(`🧭 Analizando activo manual: ${activo.simbolo}`);
          await realizarAnalisis(activo.simbolo);
        } catch (error) {
          console.error(`❌ Error al ejecutar análisis de ${activo.simbolo}:`, error);
          alert(`Error al analizar ${activo.nombre}. Verifica conexión o backend.`);
        }
      });

      seccion.appendChild(btn);
    });

    panel.appendChild(seccion);
  }
}

// === Inicialización automática ===
renderWatchlist();
