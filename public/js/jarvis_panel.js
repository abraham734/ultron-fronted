// === jarvis_panel.js ===
// Interfaz visual para Jarvis – Oro Pro (modo real demo, 24/5 activo)
// Nueva versión con estado dinámico + chispa animada en el borde
// Autor: Néstor & Quinto | Revisión: 10/nov/2025

const JARVIS_BACKEND = window.location.hostname.includes("vercel.app")
  ? "https://ultron-backend-zvtm.onrender.com"
  : "http://127.0.0.1:3000";

// === Render del panel principal ===
function renderJarvisPanel() {
  const contenedor = document.getElementById("jarvis-panel");
  if (!contenedor) {
    console.error("❌ [Jarvis] No existe <section id='jarvis-panel'> en el DOM.");
    return;
  }

  // Evitar doble render
  if (contenedor.dataset.rendered === "1") {
    console.warn("⚠️ [Jarvis] Panel ya existente, omitiendo render.");
    return;
  }

  contenedor.innerHTML = `
    <div class="jarvis-header">
      <h2>🧠 Jarvis – Oro Pro</h2>
      <div id="jarvis-status" class="jarvis-status">
        <span id="jarvis-indicador" class="indicador offline"></span>
        <span id="jarvis-estado-texto" class="estado-texto">Sin conexión</span>
      </div>
    </div>

    <div class="jarvis-body borde-chispa">
      <div class="jarvis-log" id="jarvis-log">
        <p>Esperando actividad...</p>
      </div>

      <div class="jarvis-metricas" id="jarvis-metricas">
        <p><strong>Activo:</strong> XAU/USD (Oro)</p>
        <p><strong>Modo:</strong> Real (Demo Pepperstone)</p>
        <p><strong>Intervalo:</strong> 2 minutos</p>
        <p id="ultima-lectura" class="ultima-lectura">Última lectura: -- | --</p>
      </div>
    </div>
  `;

  contenedor.dataset.rendered = "1";
  iniciarMonitoreoJarvis();
  console.log("✅ [Jarvis Panel] Renderizado con estado visual y chispa dinámica.");
}

// === Sistema de monitoreo de estado ===
async function verificarEstadoJarvis() {
  const indicador = document.getElementById("jarvis-indicador");
  const texto = document.getElementById("jarvis-estado-texto");
  const lectura = document.getElementById("ultima-lectura");
  const panel = document.querySelector(".borde-chispa");

  try {
    const res = await fetch(`${JARVIS_BACKEND}/status_jarvis`);
    const data = await res.json();

    if (data.estado === "online") {
      indicador.className = "indicador online";
      texto.textContent = "Online";
      panel.classList.add("activo");
      panel.classList.remove("error");
    } else if (data.estado === "warn") {
      indicador.className = "indicador warn";
      texto.textContent = "Sin datos recientes";
      panel.classList.remove("activo");
      panel.classList.remove("error");
    } else {
      indicador.className = "indicador offline";
      texto.textContent = "Offline";
      panel.classList.remove("activo");
      panel.classList.add("error");
    }

    // Mostrar última lectura y precio
    if (data.precioActual && data.ultimaLectura) {
      const hora = new Date(data.ultimaLectura).toLocaleTimeString();
      lectura.textContent = `Última lectura: ${data.precioActual.toFixed(2)} USD | ${hora}`;
    } else {
      lectura.textContent = "Última lectura: -- | --";
    }
  } catch (err) {
    indicador.className = "indicador offline";
    texto.textContent = "Error conexión";
    panel.classList.remove("activo");
    panel.classList.add("error");
    lectura.textContent = "Última lectura: -- | --";
  }
}

function iniciarMonitoreoJarvis() {
  verificarEstadoJarvis();
  setInterval(verificarEstadoJarvis, 15000);
}

// === Agregar mensajes al log ===
function agregarLog(mensaje) {
  const log = document.getElementById("jarvis-log");
  if (!log) return;
  const p = document.createElement("p");
  p.textContent = `${new Date().toLocaleTimeString()} – ${mensaje}`;
  log.prepend(p);
}

// === Inicialización ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 [Jarvis] Panel activo dentro de ULTRÓN (modo autónomo 24/5).");
  renderJarvisPanel();
});
