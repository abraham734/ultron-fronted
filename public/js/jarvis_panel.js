// === jarvis_panel.js ===
// Interfaz visual para Jarvis – Oro Pro (modo simulación)
// Versión inicial: muestra estado, logs y control de arranque/parada
// Fecha: 03/nov/2025

const JARVIS_BACKEND = window.location.hostname.includes("vercel.app")
  ? "https://ultron-backend-zvtm.onrender.com"
  : "http://127.0.0.1:3000";

let jarvisActivo = false;

// === Render principal ===
function renderJarvisPanel() {
  const contenedor = document.createElement("section");
  contenedor.id = "jarvis-panel";
  contenedor.innerHTML = `
    <div class="jarvis-header">
      <h2>🤖 Jarvis – Oro Pro <span class="estado">${jarvisActivo ? "🟢 Activo" : "🔴 Inactivo"}</span></h2>
      <button id="btn-toggle-jarvis" class="btn-jarvis">
        ${jarvisActivo ? "Detener" : "Iniciar"} Jarvis
      </button>
    </div>
    <div class="jarvis-body">
      <div class="jarvis-log" id="jarvis-log">
        <p>Esperando actividad...</p>
      </div>
      <div class="jarvis-metricas" id="jarvis-metricas">
        <p><strong>Activo:</strong> XAU/USD</p>
        <p><strong>Modo:</strong> Simulación</p>
        <p><strong>Intervalo:</strong> 2 minutos</p>
      </div>
    </div>
  `;
  document.body.appendChild(contenedor);
  configurarEventosJarvis();
  iniciarMonitoreoLogs();
}

// === Control de botones ===
function configurarEventosJarvis() {
  const boton = document.getElementById("btn-toggle-jarvis");
  boton.addEventListener("click", async () => {
    if (jarvisActivo) {
      await fetch(`${JARVIS_BACKEND}/api/jarvis/stop`);
      jarvisActivo = false;
      actualizarEstadoJarvis("🔴 Inactivo");
      agregarLog("🛑 Jarvis detenido manualmente.");
    } else {
      await fetch(`${JARVIS_BACKEND}/api/jarvis/start`);
      jarvisActivo = true;
      actualizarEstadoJarvis("🟢 Activo");
      agregarLog("🚀 Jarvis iniciado en modo simulación...");
    }
    boton.textContent = jarvisActivo ? "Detener Jarvis" : "Iniciar Jarvis";
  });
}

// === Actualizar estado visual ===
function actualizarEstadoJarvis(estado) {
  document.querySelector("#jarvis-panel .estado").textContent = estado;
}

// === Logs dinámicos ===
function agregarLog(mensaje) {
  const log = document.getElementById("jarvis-log");
  const p = document.createElement("p");
  p.textContent = `${new Date().toLocaleTimeString()} – ${mensaje}`;
  log.prepend(p);
}

// === Monitoreo de estado (cada 10s) ===
async function iniciarMonitoreoLogs() {
  setInterval(async () => {
    try {
      const res = await fetch(`${JARVIS_BACKEND}/api/jarvis/estado`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ultimaOperacion) {
        agregarLog(`📈 Última señal: ${data.ultimaOperacion.tipo} (${data.ultimaOperacion.motivo})`);
      }
    } catch (err) {
      console.warn("⚠️ No se pudo actualizar estado Jarvis:", err.message);
    }
  }, 10000);
}

// === Auto render al cargar DOM ===
document.addEventListener("DOMContentLoaded", renderJarvisPanel);
