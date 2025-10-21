// === watchlist.js ===

import { obtenerDatosOHLC } from "./api_twelvedata.js";
import { ejecutarAnalisisEstrategico } from "./ultron.js"; // para análisis automático

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
    { nombre: "Nasdaq (QQQ)", simbolo: "QQQ" },
    { nombre: "Real Estate (XLRE)", simbolo: "XLRE" },
    { nombre: "Financials (XLF)", simbolo: "XLF" },
    { nombre: "Health (XLV)", simbolo: "XLV" },
    { nombre: "Consumer Discretionary (XLY)", simbolo: "XLY" }
  ],

  Criptomonedas: [
    { nombre: "Bitcoin", simbolo: "BTC/USD" },
    { nombre: "Ethereum", simbolo: "ETH/USD" },
    { nombre: "Solana", simbolo: "SOL/USD" }
  ]
};

export function renderWatchlist() {
  const panel = document.createElement("div");
  panel.className = "watchlist-panel";

  for (const categoria in activosPorCategoria) {
    const seccion = document.createElement("div");
    seccion.className = "watchlist-seccion";

    const titulo = document.createElement("h3");
    titulo.textContent = categoria;
    titulo.className = "watchlist-titulo";
    seccion.appendChild(titulo);

    activosPorCategoria[categoria].forEach((activo) => {
      const btn = document.createElement("button");
      btn.className = "watchlist-boton";
      btn.textContent = activo.nombre;
      btn.dataset.simbolo = activo.simbolo;

      btn.addEventListener("click", async () => {
        try {
          const datos = await obtenerDatosOHLC(activo.simbolo);

          if (datos && datos.datos && datos.datos.length > 0) {
            const precio = parseFloat(datos.datos[0].close);
            ejecutarAnalisisEstrategico(activo.simbolo, precio);
          } else {
            console.warn(`⚠️ No se pudo obtener datos de ${activo.simbolo}`);
          }
        } catch (error) {
          console.error(`❌ Error al obtener datos de ${activo.simbolo}:`, error);
        }
      });

      seccion.appendChild(btn);
    });

    panel.appendChild(seccion);
  }

  document.body.appendChild(panel);
}

renderWatchlist();
