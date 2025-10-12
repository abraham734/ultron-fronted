// === switches.js ===
// Control de encendido/apagado de estrategias Ultron

export function renderSwitches() {
  const barra = document.getElementById("barra-estrategias");
  if (!barra) return;

  barra.innerHTML = `
    <div class="estrategia-toggle">
      <span>📦 Caja Darvas</span>
      <label class="switch">
        <input type="checkbox" id="toggle-darvas">
        <span class="slider"></span>
      </label>
    </div>
    <div class="estrategia-toggle">
      <span>🧠 Cambio Ciclo</span>
      <label class="switch">
        <input type="checkbox" id="toggle-ciclo">
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

  // Restaurar estado desde localStorage
  const switches = ["toggle-darvas", "toggle-ciclo", "toggle-tendencia" ,"toggle-supertrendDoble"];
  switches.forEach(id => {
    const toggle = document.getElementById(id);
    const saved = localStorage.getItem(id);
    if (saved !== null) toggle.checked = saved === "true";

    toggle.addEventListener("change", () => {
      localStorage.setItem(id, toggle.checked);
    });
  });
}

// Función para consultar el estado actual de estrategias
export function obtenerEstadoEstrategias() {
  return {
    darvas: document.getElementById("toggle-darvas")?.checked ?? false,
    ciclo: document.getElementById("toggle-ciclo")?.checked ?? false,
    tendencia: document.getElementById("toggle-tendencia")?.checked ?? false,
    supertrendDoble: document.getElementById("toggle-supertrendDoble")?.checked ?? false
  };
}


