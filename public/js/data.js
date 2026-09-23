// === data.js ===
// Lista sincronizada con activos.js (backend) y watchlist.js (frontend)
// Optimizada para Pepperstone + TwelveData — plan gratuito
// Actualización: septiembre 2026 — watchlist de 8 activos

export const activos = {
  Forex: [
    { nombre: "Euro / Dólar",              simbolo: "EUR/USD" },
    { nombre: "Dólar / Yen Japonés",      simbolo: "USD/JPY" },
    { nombre: "Dólar / Dólar Canadiense", simbolo: "USD/CAD" },
    { nombre: "Oro / Dólar",              simbolo: "XAU/USD" },
  ],

  Índices: [
    { nombre: "Índice del Dólar",          simbolo: "UUP" },
    { nombre: "Nasdaq 100",                simbolo: "QQQ" },
  ],

  Criptomonedas: [
    { nombre: "Bitcoin",  simbolo: "BTC/USD" },
    { nombre: "Ethereum", simbolo: "ETH/USD" },
  ]
};
