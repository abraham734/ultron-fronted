// === switches.js ===
// Control de encendido/apagado de estrategias Ultron (Frontend)
// Versión sincronizada con motorDecisionUltron 23/oct/2025

const BACKEND_URL = window.location.hostname.includes("vercel.app")
  ? "https://ultron-backend-zvtm.onrender.com"
  : "http://127.0.0.1:10000";

// === Renderiza los switches en pantalla ===
export function renderSwitches() {
  const barra = document.getElementById("barra-estrategias");
  if (!barra) return;

  barra.innerHTML = `
    <div class="estrategia-toggle">
      <span>📦 Caja Darvas</span>
      <label class="switch">
        <input type="checkbox" id="toggle-cajaDarvas">
        <span class="slider"></span>
      </label>
    </div>

    <div class="estrategia-toggle">
      <span>🧠 Cambio de Ciclo</span>
      <label class="switch">
        <input type="checkbox" id="toggle-cambioCiclo">
        <span class="slider"></span>
      </label>
    </div>

    <div class="estrategia-toggle">
      <span>📈 Tendencia</span>
      <label class="switch">
        <input type="checkbox" id="toggle-tendencia">
        <span class="slider"></span>
      </label>
    </div>

    <div class="estrategia-toggle">
      <span>💎 Supertrend Doble</span>
      <label class="switch">
        <input type="checkbox" id="toggle-supertrendDoble">
        <span class="slider"></span>
      </label>
    </div>
  `;

  // === Restaurar estados desde localStorage ===
  const switches = [
    "toggle-cajaDarvas",
    "toggle-cambioCiclo",
    "toggle-tendencia",
    "toggle-supertrendDoble"
  ];

  switches.forEach((id) => {
    const toggle = document.getElementById(id);
    const saved = localStorage.getItem(id);
    if (saved !== null) toggle.checked = saved === "true";

    toggle.addEventListener("change", () => {
      localStorage.setItem(id, toggle.checked);
      console.log(`🎚️ Estrategia ${id.replace("toggle-", "")} => ${toggle.checked ? "ON" : "OFF"}`);
    });
  });
}

// === Devuelve el estado actual de las estrategias ===
export function obtenerEstadoEstrategias() {
  return {
    cajaDarvas: document.getElementById("toggle-cajaDarvas")?.checked ?? false,
    cambioCiclo: document.getElementById("toggle-cambioCiclo")?.checked ?? false,
    tendencia: document.getElementById("toggle-tendencia")?.checked ?? false,
    supertrendDoble: document.getElementById("toggle-supertrendDoble")?.checked ?? false
  };
}
