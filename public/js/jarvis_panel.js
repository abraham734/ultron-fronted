// === jarvis_panel.js ===
// ============================================================
// 🔱 Jarvis – Oro Pro (HFv3.6 “Veterano Tranquilo + DXY”)
// Nuevo panel táctico limpio y minimalista
// Combina: Lectura del mercado, estado de señal,
// próxima entrada, última operación y estado del sistema.
// ============================================================

const JARVIS_BACKEND = window.location.hostname.includes("vercel.app")
  ? "https://ultron-backend-zvtm.onrender.com"
  : "http://127.0.0.1:3000";

// ============================================================
// RENDER DEL PANEL PRINCIPAL
// ============================================================
function renderJarvisPanel() {
  const contenedor = document.getElementById("jarvis-panel");
  if (!contenedor) return;

  if (contenedor.dataset.rendered === "1") return;

  contenedor.innerHTML = `
    <div class="jarvis-header">
      <h2>🧠 Jarvis – Oro Pro</h2>
      <div id="jarvis-status" class="jarvis-status">
        <span id="jarvis-indicador" class="indicador offline"></span>
        <span id="jarvis-estado-texto" class="estado-texto">Sin conexión</span>
      </div>
    </div>

    <div class="jarvis-body borde-chispa">

      <!-- BLOQUE A – Lectura del Mercado -->
      <div class="jarvis-box" id="lectura-mercado">
        <h3>Lectura del Mercado</h3>
        <p id="lm-xau"></p>
        <p id="lm-dxy"></p>
      </div>

      <!-- BLOQUE B – Estado de Señal -->
      <div class="jarvis-box" id="estado-senal">
        <h3>Estado de Señal</h3>
        <p id="es-condiciones"></p>
        <p id="es-proxima"></p>
      </div>

      <!-- BLOQUE C – Última Operación -->
      <div class="jarvis-box" id="ultima-operacion">
        <h3>Última Operación</h3>
        <p id="uo-info">Sin operaciones recientes.</p>
      </div>

      <!-- BLOQUE D – Estado del Sistema -->
      <div class="jarvis-box" id="estado-sistema">
        <h3>Estado del Sistema</h3>
        <p id="sis-sesion"></p>
        <p id="sis-hora"></p>
        <p id="sis-api"></p>
      </div>

    </div>
  `;

  contenedor.dataset.rendered = "1";
  iniciarMonitoreoJarvis();
}

// ============================================================
// ACTUALIZACIÓN DEL PANEL (Backend → Frontend)
// ============================================================
async function verificarEstadoJarvis() {
  try {
    const res = await fetch(`${JARVIS_BACKEND}/status_jarvis`);
    const data = await res.json();

    actualizarEstadoVisual(data);
    actualizarLecturaMercado(data);
    actualizarEstadoSenal(data);
    actualizarUltimaOperacion(data);
    actualizarEstadoSistema(data);

  } catch (err) {
    console.error("❌ Error conexión Jarvis:", err.message);
  }
}

// ============================================================
// VISUAL: ONLINE / OFFLINE / WARN
// ============================================================
function actualizarEstadoVisual(data) {
  const indicador = document.getElementById("jarvis-indicador");
  const texto = document.getElementById("jarvis-estado-texto");
  const panel = document.querySelector(".borde-chispa");

  if (!data.estado) return;

  if (data.estado === "ONLINE") {
    indicador.className = "indicador online";
    texto.textContent = "Online";
    panel.classList.add("activo");
    panel.classList.remove("error");

  } else if (data.estado === "FUERA_DE_SESION") {
    indicador.className = "indicador fuera";
    texto.textContent = "Fuera de sesión";
    panel.classList.remove("activo");

  } else if (data.estado === "SIN_DATOS") {
    indicador.className = "indicador warn";
    texto.textContent = "Sin datos";

  } else {
    indicador.className = "indicador offline";
    texto.textContent = "Offline";
    panel.classList.add("error");
  }
}

// ============================================================
// BLOQUE A – LECTURA DEL MERCADO (XAU + DXY)
// ============================================================
function actualizarLecturaMercado(data) {
  const xau = document.getElementById("lm-xau");
  const dxy = document.getElementById("lm-dxy");

  if (!data.lectura) {
    xau.textContent = "XAU/USD: Esperando datos…";
    dxy.textContent = "DXY: Esperando datos…";
    return;
  }

  xau.textContent = `
    XAU/USD → ${data.lectura.precioXAU} USD | 
    Rango 1m: ${data.lectura.rango} | 
    Tendencia 5m: ${data.lectura.tendencia5m} | 
    Impulso 1m: ${data.lectura.impulso1m}
  `;

  dxy.textContent = `
    DXY → ${data.lectura.precioDXY} | 
    Tendencia DXY: ${data.lectura.tendenciaDXY} | 
    Compatibilidad: ${data.lectura.compatibilidad}
  `;
}

// ============================================================
// BLOQUE B – ESTADO DE SEÑAL + PRÓXIMA ENTRADA
// ============================================================
function actualizarEstadoSenal(data) {
  const cond = document.getElementById("es-condiciones");
  const prox = document.getElementById("es-proxima");

  if (!data.senalHF) {
    cond.textContent = "Condiciones: Analizando...";
    prox.textContent = "Próxima entrada: --";
    return;
  }

  cond.textContent = data.senalHF.condiciones;
  prox.textContent = data.senalHF.proxima;
}

// ============================================================
// BLOQUE C – ÚLTIMA OPERACIÓN
// ============================================================
function actualizarUltimaOperacion(data) {
  const uo = document.getElementById("uo-info");

  if (!data.ultimaOperacion) {
    uo.textContent = "Sin operaciones recientes.";
    return;
  }

  const op = data.ultimaOperacion;

  uo.innerHTML = `
    ${op.tipo} | Entrada: ${op.entry} | 
    TP: ${op.tp} | SL: ${op.sl} <br>
    Resultado: ${op.resultado} | Duración: ${op.duracion}m
  `;
}

// ============================================================
// BLOQUE D – SISTEMA
// ============================================================
function actualizarEstadoSistema(data) {
  const sesion = document.getElementById("sis-sesion");
  const hora = document.getElementById("sis-hora");
  const api = document.getElementById("sis-api");

  sesion.textContent = `Sesión: ${data.sesion || "--"}`;
  hora.textContent = `Hora UTC: ${data.horaUTC || "--"}`;
  api.textContent = `API: ${data.api || "OK"}`;
}

// ============================================================
// INICIO
// ============================================================
function iniciarMonitoreoJarvis() {
  verificarEstadoJarvis();
  setInterval(verificarEstadoJarvis, 8000);
}

document.addEventListener("DOMContentLoaded", () => {
  renderJarvisPanel();
});
