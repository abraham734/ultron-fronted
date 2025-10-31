// === switches.js ===
// Control de 5 estrategias con switch visual triple (OFF / STANDARD / RIESGO)
// Versión final 29/oct/2025 con tooltip dinámico

export function renderSwitches() {
  const barra = document.getElementById("barra-estrategias");
  if (!barra) return;

  const estrategias = [
    { id: "modo-cajaDarvas", nombre: "📦 Caja Darvas + SQZEE" },
    { id: "modo-cambioCiclo", nombre: "🧠 Cambio de Ciclo" },
    { id: "modo-tendencia", nombre: "📈 Tendencia" },
    { id: "modo-supertrendDoble", nombre: "💎 Supertrend Doble" },
    { id: "modo-emaTriple", nombre: "📊 Triple EMA + SQZEE" },
  ];

  // === Render dinámico ===
  barra.innerHTML = estrategias
    .map(
      (e) => `
      <div class="estrategia-toggle">
        <span>${e.nombre}</span>
        <div id="${e.id}" class="switch-triple"></div>
      </div>
    `
    )
    .join("");

  // === Cargar y activar estado desde localStorage ===
  estrategias.forEach(({ id }) => {
    const switchEl = document.getElementById(id);
    let estado = localStorage.getItem(id) || "OFF";

    aplicarEstadoVisual(switchEl, estado);

    switchEl.addEventListener("click", () => {
      estado = siguienteEstado(estado);
      aplicarEstadoVisual(switchEl, estado);
      localStorage.setItem(id, estado);
      console.log(`🎚️ Estrategia ${id.replace("modo-", "")} => ${estado}`);
    });
  });
}

// === Alterna entre OFF → STANDARD → RIESGO ===
function siguienteEstado(actual) {
  if (actual === "OFF") return "STANDARD";
  if (actual === "STANDARD") return "RIESGO";
  return "OFF";
}

// === Aplica color, posición y tooltip ===
function aplicarEstadoVisual(elemento, estado) {
  elemento.className = "switch-triple"; // limpia clases previas
  elemento.setAttribute("title", `Modo: ${estado}`); // tooltip dinámico
  if (estado === "STANDARD") elemento.classList.add("standard");
  if (estado === "RIESGO") elemento.classList.add("riesgo");
}

// === Devuelve el modo actual de cada estrategia ===
export function obtenerEstadoEstrategias() {
  const ids = [
    "modo-cajaDarvas",
    "modo-cambioCiclo",
    "modo-tendencia",
    "modo-supertrendDoble",
    "modo-emaTriple",
  ];
  const get = (id) => localStorage.getItem(id) || "OFF";

  return {
    cajaDarvas: get(ids[0]),
    cambioCiclo: get(ids[1]),
    tendencia: get(ids[2]),
    supertrendDoble: get(ids[3]),
    emaTriple: get(ids[4]),
  };
}
