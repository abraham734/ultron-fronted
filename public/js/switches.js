// === switches.js ===
// Control Triple Switch de estrategias Ultron (Frontend)
// Versión actualizada 28/oct/2025

const BACKEND_URL = window.location.hostname.includes("vercel.app")
  ? "https://ultron-backend-zvtm.onrender.com"
  : "http://127.0.0.1:10000";

// === Renderiza los switches en pantalla ===
export function renderSwitches() {
  const barra = document.getElementById("barra-estrategias");
  if (!barra) return;

  // === Plantilla con selectores de tres estados ===
  barra.innerHTML = `
    <div class="estrategia-toggle">
      <span>📦 Caja Darvas</span>
      <select id="modo-cajaDarvas" class="triple-switch">
        <option value="OFF">OFF</option>
        <option value="STANDARD">STANDARD</option>
        <option value="RIESGO">RIESGO</option>
      </select>
    </div>

    <div class="estrategia-toggle">
      <span>🧠 Cambio de Ciclo</span>
      <select id="modo-cambioCiclo" class="triple-switch">
        <option value="OFF">OFF</option>
        <option value="STANDARD">STANDARD</option>
        <option value="RIESGO">RIESGO</option>
      </select>
    </div>

    <div class="estrategia-toggle">
      <span>📈 Tendencia</span>
      <select id="modo-tendencia" class="triple-switch">
        <option value="OFF">OFF</option>
        <option value="STANDARD">STANDARD</option>
        <option value="RIESGO">RIESGO</option>
      </select>
    </div>

    <div class="estrategia-toggle">
      <span>💎 Supertrend Doble</span>
      <select id="modo-supertrendDoble" class="triple-switch">
        <option value="OFF">OFF</option>
        <option value="STANDARD">STANDARD</option>
        <option value="RIESGO">RIESGO</option>
      </select>
    </div>

    <div class="estrategia-toggle">
      <span>📊 Triple EMA + ADX</span>
      <select id="modo-emaTriple" class="triple-switch">
        <option value="OFF">OFF</option>
        <option value="STANDARD">STANDARD</option>
        <option value="RIESGO">RIESGO</option>
      </select>
    </div>
  `;

  // === Restaurar modos desde localStorage ===
  const modulos = [
    "modo-cajaDarvas",
    "modo-cambioCiclo",
    "modo-tendencia",
    "modo-supertrendDoble",
    "modo-emaTriple"
  ];

  modulos.forEach((id) => {
    const selector = document.getElementById(id);
    const saved = localStorage.getItem(id);
    if (saved) selector.value = saved;

    selector.addEventListener("change", () => {
      localStorage.setItem(id, selector.value);
      console.log(`🎚️ Estrategia ${id.replace("modo-", "")} => ${selector.value}`);
    });
  });
}

// === Devuelve el modo actual de cada estrategia ===
export function obtenerEstadoEstrategias() {
  const get = (id) => document.getElementById(id)?.value || "OFF";
  return {
    cajaDarvas: get("modo-cajaDarvas"),
    cambioCiclo: get("modo-cambioCiclo"),
    tendencia: get("modo-tendencia"),
    supertrendDoble: get("modo-supertrendDoble"),
    emaTriple: get("modo-emaTriple")
  };
}
