// === data.js ===
// Lista sincronizada con activos.js (backend) y watchlist.js (frontend)
// Optimizada para Pepperstone + TwelveData — plan gratuito
// Actualización: junio 2026

export const activos = {
  Forex: [
    { nombre: "Euro / Dólar",          simbolo: "EUR/USD" },
    { nombre: "Libra / Dólar",         simbolo: "GBP/USD" },
    { nombre: "Dólar / Yen Japonés",   simbolo: "USD/JPY" },
    { nombre: "Dólar / Franco Suizo",  simbolo: "USD/CHF" },
    { nombre: "Dólar Australiano",     simbolo: "AUD/USD" },
    { nombre: "Dólar Neozelandés",     simbolo: "NZD/USD" },
    { nombre: "Oro / Dólar",           simbolo: "XAU/USD" },
  ],

  Acciones: [
    { nombre: "Nvidia",  simbolo: "NVDA" },
    { nombre: "AMD",     simbolo: "AMD"  },
    { nombre: "Ford",    simbolo: "F"    },
  ],

  Índices: [
    { nombre: "Dow Jones (DIA)",  simbolo: "DIA" },  // proxy US30
    { nombre: "Nasdaq 100 (QQQ)", simbolo: "QQQ" },  // proxy NAS100
    { nombre: "S&P 500 (SPY)",    simbolo: "SPY" },  // proxy US500
  ],

  Criptomonedas: [
    { nombre: "Bitcoin",  simbolo: "BTC/USD" },
    { nombre: "Ethereum", simbolo: "ETH/USD" },
    { nombre: "Solana",   simbolo: "SOL/USD" },
    { nombre: "XRP",      simbolo: "XRP/USD" },
  ]
};
