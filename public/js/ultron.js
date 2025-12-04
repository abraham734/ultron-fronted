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
  const simbolo = resultado.simbolo;
  const precio = resultado.precioActual || resultado.entry || "—";
  const sesion = resultado.session || "—";
  const momentum = resultado.momentum || "—";
  const supertrend = resultado.supertrendTrend || "—";
  const tendencia = resultado.tendenciaGeneral || "—";
  const squeeze = resultado.squeeze?.squeezeOn ? "Activo" : "No";
  const bos = resultado.bosDirection || "—";
  const volatilidad = resultado.volatilidad || "—";
  const lectura = resultado.ultimaLectura || "Sin lectura";
  const razon = resultado.razones?.[0] || "—";

  return `
  <section id="diagnostico-panel" class="diagnostico-panel">

    <div class="diag-header">
      <span class="diag-titulo">🔍 Diagnóstico — ${simbolo}</span>
      <span class="diag-precio">💹 ${precio}</span>
    </div>

    <div class="diag-fila">
      <div class="diag-col">🌐 <strong>Sesión:</strong> ${sesion}</div>
      <div class="diag-col">🧭 <strong>Tendencia:</strong> ${tendencia}</div>
    </div>

    <div class="diag-fila">
      <div class="diag-col">⚡ <strong>Momentum:</strong> ${momentum}</div>
      <div class="diag-col">📊 <strong>Supertrend:</strong> ${supertrend}</div>
    </div>

    <div class="diag-fila">
      <div class="diag-col">🎯 <strong>BOS Dirección:</strong> ${bos}</div>
      <div class="diag-col">🟣 <strong>Squeeze:</strong> ${squeeze}</div>
    </div>

    <div class="diag-fila">
      <div class="diag-col">🌪 <strong>Volatilidad:</strong> ${volatilidad}</div>
      <div class="diag-col">⏳ <strong>Velas:</strong> ${resultado.velas || "200"}</div>
    </div>

    <div class="diag-footer">
      <p>📝 <strong>Última lectura:</strong> ${lectura}</p>
      <p>🤖 <strong>Razón de Ultron:</strong> ${razon}</p>
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
