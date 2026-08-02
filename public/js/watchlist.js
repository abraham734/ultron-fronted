// === watchlist.js ===
// Panel lateral de activos (tipo TradingView) con conexión directa al flujo de análisis principal
// Sincronizado con activos.js (backend) y data.js (frontend)
// Actualización: junio 2026

import { realizarAnalisis } from "./ultron.js"; // ✅ usa el mismo flujo POST oficial

// === Categorías y activos ===
export const activosPorCategoria = {
  Forex: [
    { nombre: "Euro / Dólar",             simbolo: "EUR/USD" },
    { nombre: "Libra / Dólar",            simbolo: "GBP/USD" },
    { nombre: "Dólar / Yen Japonés",      simbolo: "USD/JPY" },
    { nombre: "Dólar / Franco Suizo",     simbolo: "USD/CHF" },
    { nombre: "Dólar Australiano",        simbolo: "AUD/USD" },
    { nombre: "Dólar Neozelandés",        simbolo: "NZD/USD" },
    { nombre: "Dólar / Dólar Canadiense", simbolo: "USD/CAD" },
    { nombre: "Libra / Yen Japonés",      simbolo: "GBP/JPY" },
    { nombre: "Oro / Dólar",              simbolo: "XAU/USD" },
  ],

  Criptomonedas: [
    { nombre: "Bitcoin",  simbolo: "BTC/USD" },
    { nombre: "Ethereum", simbolo: "ETH/USD" },
    { nombre: "Solana",   simbolo: "SOL/USD" },
    { nombre: "XRP",      simbolo: "XRP/USD" },
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
