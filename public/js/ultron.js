// === ultron.js ===
// Lógica principal del asistente ULTRÓN – Optimizada para control de consumo API y estabilidad
// Versión extendida con Panel Diagnóstico Live + Parpadeo BUY/SELL

import { activos } from "./data.js";
import { renderSwitches, obtenerEstadoEstrategias } from "./switches.js";
import { cargarHistorialDesdeStorage, registrarEntradaUltron } from "./historial.js";
import { obtenerIntervaloActivo, guardarIntervaloActivo } from "./intervalosporactivo.js";
import { cargarDiagnosticoMotor } from "./diagnostico_motor.js";

// === URL dinámica del backend ===
const BACKEND_URL = window.location.hostname.includes("vercel.app")
  ? "https://ultron-backend-zvtm.onrender.com"
  : "http://127.0.0.1:3000";

// === Variables de control ===
let analisisEnProgreso = false;
let modoAPILimitado = false;
let tiempoRestanteAPI = 0;

let activoActual = null;
let timeoutParpadeo = null;

// ============================================================
// 🧠 EVENTO PRINCIPAL — ULTRON INICIALIZADO
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Interfaz ULTRÓN cargada correctamente.");

  renderSwitches();
  cargarHistorialDesdeStorage();

  console.log("📭 SYNC_INIT deshabilitado para ahorrar API.");

  const selectorIntervalo = document.getElementById("selector-intervalo");
  if (selectorIntervalo) {
    selectorIntervalo.addEventListener("change", () => {
      const activoActual = localStorage.getItem("activoActual");
      if (activoActual) {
        guardarIntervaloActivo(activoActual, selectorIntervalo.value);
        console.log(`🕒 Intervalo guardado para ${activoActual}: ${selectorIntervalo.value}`);
      }
    });
  }

  verificarConexionBackend();
});

// ============================================================
// 🟦 VERIFICACIÓN DE BACKEND
// ============================================================
async function verificarConexionBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}`);
    if (res.ok) console.log("🟢 Backend ping exitoso:", res.status);
    else console.warn("⚠️ Backend no responde:", res.status);
  } catch (error) {
    console.error("❌ Error ping backend:", error.message);
  }
}

// ============================================================
// 🎯 LISTA DE ACTIVOS
// ============================================================
function renderListaActivos(categoria) {
  const lista = activos[categoria];
  const contenedor = document.getElementById("activos-container");
  if (!lista || !contenedor) return;

  contenedor.innerHTML = `
    <h3>🧠 Selecciona un activo para analizar (${categoria.toUpperCase()})</h3>
    <div class="lista-activos">
      ${lista.map(
        (activo) => `
          <button class="btn-activo" data-simbolo="${activo.simbolo}">
            ${activo.nombre}
          </button>`
      ).join("")}
    </div>
  `;

  document.querySelectorAll(".btn-activo").forEach((btn) => {
    btn.addEventListener("click", () => {
      realizarAnalisis(btn.dataset.simbolo);
    });
  });
}

// ============================================================
// 🧠 ANÁLISIS PRINCIPAL
// ============================================================
async function realizarAnalisis(simbolo) {
  if (analisisEnProgreso) {
    console.warn("⏳ Análisis ya corriendo...");
    return;
  }
  if (modoAPILimitado) {
    alert("⚠️ API limitada. Intenta después de las 6:00 p.m.");
    return;
  }

  analisisEnProgreso = true;
  setTimeout(() => (analisisEnProgreso = false), 5000);

  const estrategiasActivas = obtenerEstadoEstrategias();
  localStorage.setItem("estrategiasActivas", JSON.stringify(estrategiasActivas));
  localStorage.setItem("activoActual", simbolo);

  const intervalo = obtenerIntervaloActivo(simbolo);

  let contenedor = document.getElementById("contenedor-activos");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "contenedor-activos";
    document.body.appendChild(contenedor);
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/analisis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simbolo, intervalo, estrategiasActivas }),
    });

    if (!res.ok) {
      if (res.status === 429) activarModoAPILimitado();
      throw new Error("Error HTTP " + res.status);
    }

    const resultado = await res.json();

    if (resultado?.error?.includes("limit")) {
      activarModoAPILimitado();
      contenedor.innerHTML = `<p class="error">🚫 Límite API alcanzado.</p>`;
      return;
    }

    if (!resultado.simbolo) {
      contenedor.innerHTML = `<p class="error">⚠️ Sin datos para ${simbolo}</p>`;
      return;
    }

    // Cambió activo → cancelar parpadeo
    if (activoActual !== resultado.simbolo) {
      detenerParpadeo();
      activoActual = resultado.simbolo;
    }

    // Barra escaneo
    let barra = document.querySelector(".barra-escaneo");
    if (barra) {
      barra.textContent = `🔍 Escaneando: ${resultado.simbolo} – Estrategia: ${resultado.tipoEntrada || "—"} [${intervalo}]`;
    }

    // ============================================================
    // 🚀 NUEVO RENDER: SOLO PANEL DIAGNÓSTICO (sin configuraciones)
    // ============================================================
    contenedor.innerHTML = renderPanelDiagnostico(resultado);

    // Diagnóstico motor original
    await cargarDiagnosticoMotor(resultado.simbolo, resultado.intervalo);

    // Registrar si es entrada válida
    if (resultado.decision === "OPERAR" && resultado.entry && resultado.stop) {
      registrarEntradaUltron({
        activo: resultado.simbolo,
        tipoEntrada: resultado.tipoEntrada,
        sentido: resultado.sentido || "-",
        entry: resultado.entry,
        sl: resultado.stop,
        tp1: resultado.tp1,
        tp2: resultado.tp2,
        tp3: resultado.tp3,
        fechaHora: new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })
      });

      activarParpadeo(resultado.sentido);
    }

  } catch (e) {
    contenedor.innerHTML = `<p class="error">❌ Error: ${e.message}</p>`;
  }
}

// ============================================================
// 🔵 PANEL DIAGNÓSTICO LIVE — FORMATO B (ICONOS)
// ============================================================
function renderPanelDiagnostico(resultado) {
  // === Datos recibidos desde backend ===
  const diag = resultado.diagnostico || {};
  const razones = resultado.razones || [];
  const squeeze = resultado.squeeze || {};
  const simbolo = resultado.simbolo || "—";

  const precio = resultado.precioActual || resultado.entry || "—";
  const sesion = resultado.session || "—";
  const intervalo = resultado.intervalo || "—";

  // === Diagnóstico técnico ===
  const tendencia = diag.tendencia || "—";
  const momentum = diag.momentum ?? "—";
  const supertrend = diag.supertrend || "—";
  const volatilidad = diag.volatilidad ?? "—";
  const velas = diag.velas || "—";

  // === Squeeze extendido ===
  const squeezeEstado = squeeze.squeezeOn ? "ON" : (squeeze.squeezeOff ? "OFF" : "—");
  const squeezeDir = squeeze.direction || "—";
  const squeezeMom = squeeze.momentum ?? "—";

  // === Razones formateadas ===
  const listaRazones = razones.length
    ? razones.map(r => `<li>• ${r}</li>`).join("")
    : "<li>— Sin razones reportadas —</li>";

  return `
  <section id="diagnostico-panel" class="diagnostico-panel ultron-render">

    <header class="diag-header">
      <span class="diag-titulo">🔍 Diagnóstico — ${simbolo}</span>
      <span class="diag-precio">💹 ${precio}</span>
    </header>

    <div class="diag-meta">
      <p><strong>📡 Sesión:</strong> ${sesion}</p>
      <p><strong>⏱ Intervalo:</strong> ${intervalo}</p>
      <p><strong>🕯 Velas:</strong> ${velas}</p>
    </div>

    <hr>

    <div class="diag-grid">

      <div class="diag-item">
        <span>🧭 Tendencia</span>
        <strong>${tendencia}</strong>
      </div>

      <div class="diag-item">
        <span>⚡ Momentum</span>
        <strong>${momentum}</strong>
      </div>

      <div class="diag-item">
        <span>📊 Supertrend</span>
        <strong>${supertrend}</strong>
      </div>

      <div class="diag-item">
        <span>🌪 Volatilidad (ATR)</span>
        <strong>${volatilidad}</strong>
      </div>

      <div class="diag-item">
        <span>🟣 Squeeze</span>
        <strong>${squeezeEstado}</strong>
      </div>

      <div class="diag-item">
        <span>🌀 Dir. Squeeze</span>
        <strong>${squeezeDir}</strong>
      </div>

      <div class="diag-item">
        <span>📈 Mom. Squeeze</span>
        <strong>${squeezeMom}</strong>
      </div>

    </div>

    <hr>

    <div class="diag-razones">
      <h4>🤖 Razones del Motor:</h4>
      <ul>${listaRazones}</ul>
    </div>

  </section>
  `;
}

// ============================================================
// 🔴🟢 PARPADEO BUY / SELL (1 MINUTO)
// ============================================================
function activarParpadeo(sentido) {
  const panel = document.getElementById("diagnostico-panel");
  if (!panel) return;

  detenerParpadeo();

  if (String(sentido).toLowerCase() === "buy") {
    panel.classList.add("parpadeo-buy");
  } else {
    panel.classList.add("parpadeo-sell");
  }

  timeoutParpadeo = setTimeout(detenerParpadeo, 60000);
}

function detenerParpadeo() {
  const panel = document.getElementById("diagnostico-panel");
  if (!panel) return;
  panel.classList.remove("parpadeo-buy", "parpadeo-sell");
  if (timeoutParpadeo) clearTimeout(timeoutParpadeo);
}

// === Exportaciones ===
export { renderListaActivos, realizarAnalisis, realizarAnalisis as ejecutarAnalisisEstrategico };
