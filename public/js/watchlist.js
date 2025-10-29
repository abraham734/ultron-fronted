// === watchlist.js ===
// Panel lateral de activos (tipo TradingView) con conexión directa al flujo de análisis principal
// Versión táctica 29/oct/2025 – sin ETFs, solo activos volátiles

import { realizarAnalisis } from "./ultron.js"; // ✅ usa el mismo flujo POST oficial

// === Categorías y activos ===
export const activosPorCategoria = {
  Forex: [
    { nombre: "Euro / Dólar", simbolo: "EUR/USD" },
    { nombre: "Oro / Dólar", simbolo: "XAU/USD" },
    { nombre: "Euro / Yen Japonés", simbolo: "EUR/JPY" },
    { nombre: "Libra / Dólar", simbolo: "GBP/USD" },
    { nombre: "Dólar / Yen Japonés", simbolo: "USD/JPY" },
    { nombre: "Dólar / Peso Mexicano", simbolo: "USD/MXN" }
  ],

  Acciones: [
    { nombre: "Google", simbolo: "GOOG" },
    { nombre: "Tesla", simbolo: "TSLA" },
    { nombre: "Apple", simbolo: "AAPL" }
  ],

  Índices: [
    { nombre: "S&P 500", simbolo: "SP500" },
    { nombre: "Nasdaq 100", simbolo: "NDX" }
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
