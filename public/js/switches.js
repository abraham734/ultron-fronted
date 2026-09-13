// === switches.js ===
// Control visual de estrategias (OFF / STANDARD / RIESGO)
// 🔄 Versión sincronizada con backend – 10/nov/2025
// Cada cambio de switch se envía al backend (https://ultron-backend-zvtm.onrender.com)

const URL_BACKEND = "https://ultron-backend-zvtm.onrender.com/api/estrategias";

export function renderSwitches() {
  const barra = document.getElementById("barra-estrategias");
  if (!barra) return;

  const estrategias = [
    { id: "modo-cajaDarvas", nombre: "📦 Caja Darvas + SQZEE" },
    { id: "modo-cambioCiclo", nombre: "🧠 Cambio de Ciclo" },
    { id: "modo-tendencia", nombre: "📈 Tendencia" },
    { id: "modo-supertrendDoble", nombre: "💎 Gann" },
    { id: "modo-emaTriple", nombre: "📈 Pullback Tendencia 4H" },
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

    switchEl.addEventListener("click", async () => {
      estado = siguienteEstado(estado);
      aplicarEstadoVisual(switchEl, estado);
      localStorage.setItem(id, estado);

      // === 🔄 Enviar actualización al backend ===
      try {
        await sincronizarConBackend();
        console.log(`✅ Estrategias sincronizadas con backend (${estado})`);
      } catch (err) {
        console.warn("⚠️ Error al sincronizar estrategias con backend:", err.message);
      }
    });
  });

  // Sincronización inicial al renderizar
  sincronizarConBackend();
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

// === Enviar todos los estados actuales al backend ===
async function sincronizarConBackend() {
  const estados = obtenerEstadoEstrategias();
  const res = await fetch(URL_BACKEND, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(estados),
  });
  if (!res.ok) throw new Error(`Respuesta HTTP ${res.status}`);
  return res.json();
}
