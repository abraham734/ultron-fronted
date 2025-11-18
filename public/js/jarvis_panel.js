// === jarvis_panel.js ===
// Interfaz visual para Jarvis – Oro Pro (HFv3.0 Élite con sistema de estados)
// Autor: Néstor & Quinto | Revisión final: 17/nov/2025

const JARVIS_BACKEND = window.location.hostname.includes("vercel.app")
  ? "https://ultron-backend-zvtm.onrender.com"
  : "http://127.0.0.1:3000";

// ============================================================
// RENDER DEL PANEL
// ============================================================
function renderJarvisPanel() {
  const contenedor = document.getElementById("jarvis-panel");
  if (!contenedor) {
    console.error("❌ [Jarvis] No existe <section id='jarvis-panel'> en el DOM.");
    return;
  }

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
  console.log("✅ [Jarvis Panel] Renderizado con estado visual dinámico.");
}

// ============================================================
// SISTEMA DE MONITOREO (LEE ESTADOS DEL BACKEND)
// ============================================================
async function verificarEstadoJarvis() {
  const indicador = document.getElementById("jarvis-indicador");
  const texto = document.getElementById("jarvis-estado-texto");
  const lectura = document.getElementById("ultima-lectura");
  const panel = document.querySelector(".borde-chispa");

  try {
    const res = await fetch(`${JARVIS_BACKEND}/status_jarvis`);
    const data = await res.json();

    // === 🔵 ESTADOS DEL BACKEND ============
    // ONLINE
    if (data.estado === "ONLINE") {
      indicador.className = "indicador online";
      texto.textContent = "Online";
      panel.classList.add("activo");
      panel.classList.remove("error");
    }
    // FUERA_DE_SESION
    else if (data.estado === "FUERA_DE_SESION") {
      indicador.className = "indicador fuera";
      texto.textContent = "Fuera de sesión (Londres + NY)";
      panel.classList.remove("activo");
      panel.classList.remove("error");
    }
    // SIN_DATOS
    else if (data.estado === "SIN_DATOS") {
      indicador.className = "indicador warn";
      texto.textContent = "Sin datos (API / Candle vacía)";
      panel.classList.remove("activo");
      panel.classList.remove("error");
    }
    // ERROR
    else if (data.estado === "ERROR") {
      indicador.className = "indicador offline";
      texto.textContent = "Error interno";
      panel.classList.add("error");
      panel.classList.remove("activo");
    }
    // Desconocido
    else {
      indicador.className = "indicador offline";
      texto.textContent = "Offline";
      panel.classList.add("error");
      panel.classList.remove("activo");
    }

    // === ACTUALIZAR ÚLTIMA LECTURA ============
    if (data.precioActual && data.ultimaLectura) {
      const hora = new Date(data.ultimaLectura).toLocaleTimeString();
      lectura.textContent = `Última lectura: ${data.precioActual.toFixed(2)} USD | ${hora}`;
    } else {
      lectura.textContent = "Última lectura: -- | --";
    }

  } catch (err) {
    indicador.className = "indicador offline";
    texto.textContent = "Error conexión";
    panel.classList.add("error");
    panel.classList.remove("activo");
    lectura.textContent = "Última lectura: -- | --";
  }
}

// ============================================================
// INTERVALO DE ACTUALIZACIÓN
// ============================================================
function iniciarMonitoreoJarvis() {
  verificarEstadoJarvis();
  setInterval(verificarEstadoJarvis, 10000); // cada 10s
}

// ============================================================
// LOG DE EVENTOS
// ============================================================
function agregarLog(mensaje) {
  const log = document.getElementById("jarvis-log");
  if (!log) return;
  const p = document.createElement("p");
  p.textContent = `${new Date().toLocaleTimeString()} – ${mensaje}`;
  log.prepend(p);
}

// ============================================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 [Jarvis] Panel activo dentro de ULTRÓN (HFv3.0 Élite).");
  renderJarvisPanel();
});
