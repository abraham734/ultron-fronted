// === jarvis_panel.js ===
// Interfaz visual para Jarvis – Oro Pro (modo simulación)
// Versión revisada: control completo de arranque/parada + monitoreo backend
// Fecha: 03/nov/2025 (revisión táctica)

// === Configuración de backend dinámico ===
const JARVIS_BACKEND = window.location.hostname.includes("vercel.app")
  ? "https://ultron-backend-zvtm.onrender.com"
  : "http://127.0.0.1:3000";

let jarvisActivo = false;
let intervaloLogs = null;

// === Render principal ===
function renderJarvisPanel() {
  // Evita duplicar el panel si ya existe
  if (document.getElementById("jarvis-panel")) return;

  const contenedor = document.createElement("section");
  contenedor.id = "jarvis-panel";
  contenedor.innerHTML = `
    <div class="jarvis-header">
      <h2>🤖 Jarvis – Oro Pro 
        <span class="estado">${jarvisActivo ? "🟢 Activo" : "🔴 Inactivo"}</span>
      </h2>
      <button id="btn-toggle-jarvis" class="btn-jarvis">
        ${jarvisActivo ? "Detener Jarvis" : "Iniciar Jarvis"}
      </button>
    </div>

    <div class="jarvis-body">
      <div class="jarvis-log" id="jarvis-log">
        <p>📡 Esperando actividad del sistema...</p>
      </div>
      <div class="jarvis-metricas" id="jarvis-metricas">
        <p><strong>Activo:</strong> XAU/USD</p>
        <p><strong>Modo:</strong> Simulación</p>
        <p><strong>Intervalo:</strong> 2 minutos</p>
      </div>
    </div>
  `;

  // Inserta el panel al final del body, debajo de todo el contenido existente
  document.body.appendChild(contenedor);

  configurarEventosJarvis();
  verificarEstadoInicial();
  iniciarMonitoreoLogs();

  console.log("🟢 [Jarvis Panel] Renderizado correctamente.");
}

// === Verificar estado inicial desde backend ===
async function verificarEstadoInicial() {
  try {
    const res = await fetch(`${JARVIS_BACKEND}/api/jarvis/estado`);
    if (!res.ok) throw new Error("Backend no responde");
    const data = await res.json();
    jarvisActivo = data.activo;
    actualizarEstadoJarvis(jarvisActivo ? "🟢 Activo" : "🔴 Inactivo");
    document.getElementById("btn-toggle-jarvis").textContent =
      jarvisActivo ? "Detener Jarvis" : "Iniciar Jarvis";
    agregarLog(`🔍 Estado inicial: ${jarvisActivo ? "activo" : "inactivo"}`);
  } catch (err) {
    console.warn("⚠️ No se pudo verificar estado inicial:", err.message);
    agregarLog("⚠️ No se pudo conectar con el backend de Jarvis.");
  }
}

// === Control de botones ===
function configurarEventosJarvis() {
  const boton = document.getElementById("btn-toggle-jarvis");
  boton.addEventListener("click", async () => {
    try {
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
    } catch (err) {
      console.error("❌ Error al alternar Jarvis:", err.message);
      agregarLog("❌ No se pudo comunicar con el backend.");
    }
  });
}

// === Actualizar estado visual ===
function actualizarEstadoJarvis(estado) {
  const label = document.querySelector("#jarvis-panel .estado");
  if (label) label.textContent = estado;
}

// === Logs dinámicos ===
function agregarLog(mensaje) {
  const log = document.getElementById("jarvis-log");
  if (!log) return;
  const p = document.createElement("p");
  p.textContent = `${new Date().toLocaleTimeString("es-MX")} – ${mensaje}`;
  log.prepend(p);
}

// === Monitoreo de estado (cada 10s) ===
function iniciarMonitoreoLogs() {
  // Evita múltiples intervalos activos
  if (intervaloLogs) clearInterval(intervaloLogs);

  intervaloLogs = setInterval(async () => {
    try {
      const res = await fetch(`${JARVIS_BACKEND}/api/jarvis/estado`);
      if (!res.ok) return;
      const data = await res.json();

      if (data?.ultimaOperacion) {
        const { tipo, motivo } = data.ultimaOperacion;
        agregarLog(`📈 Última señal: ${tipo} (${motivo})`);
      }
    } catch (err) {
      console.warn("⚠️ No se pudo actualizar estado Jarvis:", err.message);
    }
  }, 10000);
}

// === Auto render al cargar DOM ===
document.addEventListener("DOMContentLoaded", renderJarvisPanel);
