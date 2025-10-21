// === switches.js ===
// Control de encendido/apagado de estrategias Ultron (Frontend + sincronización con backend)

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

  // Restaurar estado desde localStorage y agregar eventos
  const switches = ["toggle-darvas", "toggle-ciclo", "toggle-tendencia", "toggle-supertrendDoble"];
  switches.forEach(id => {
    const toggle = document.getElementById(id);
    const saved = localStorage.getItem(id);
    if (saved !== null) toggle.checked = saved === "true";

    toggle.addEventListener("change", () => {
      localStorage.setItem(id, toggle.checked);
      actualizarSwitchesBackend(); // 🚀 sincronizar con backend
    });
  });

  // Enviar al backend al cargar la página también (opcional)
  actualizarSwitchesBackend();
}

// === Sincroniza los estados con el backend ===
async function actualizarSwitchesBackend() {
  const estado = obtenerEstadoEstrategias();

  try {
    const response = await fetch(`${BACKEND_URL}/api/configurar-estrategias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(estado)
    });

    if (!response.ok) {
      console.warn("⚠️ Error al actualizar estrategias en backend:", await response.text());
    } else {
      console.log("✅ Estrategias sincronizadas con backend:", estado);
    }
  } catch (error) {
    console.error("❌ Error al sincronizar estrategias con backend:", error.message);
  }
}

// === Consulta los estados actualizados desde la interfaz ===
export function obtenerEstadoEstrategias() {
  return {
    darvas: document.getElementById("toggle-darvas")?.checked ?? false,
    ciclo: document.getElementById("toggle-ciclo")?.checked ?? false,
    tendencia: document.getElementById("toggle-tendencia")?.checked ?? false,
    supertrendDoble: document.getElementById("toggle-supertrendDoble")?.checked ?? false
  };
}
