// === ultron.js ===
// Lógica principal del asistente ULTRÓN – Optimizada para control de consumo API y estabilidad
// Versión extendida con Panel Diagnóstico Live + Parpadeo BUY/SELL

import { activos } from "./data.js";
import { renderSwitches, obtenerEstadoEstrategias } from "./switches.js";
import { obtenerIntervaloActivo, guardarIntervaloActivo } from "./intervalosporactivo.js";
//import { registrarEntradaUltron } from "./historial.js";//


// === URL dinámica del backend ===
const BACKEND_URL = window.location.hostname.includes("vercel.app")
  ? "https://ultron-backend-zvtm.onrender.com"
  : "http://127.0.0.1:3000";

let analisisEnProgreso = false;
let modoAPILimitado = false;
let activoActual = null;
let timeoutParpadeo = null;

// ============================================================
// 🧠 INICIALIZACIÓN
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  renderSwitches();
  
  verificarConexionBackend();

  const selectorIntervalo = document.getElementById("selector-intervalo");
  if (selectorIntervalo) {
    selectorIntervalo.addEventListener("change", () => {
      const activo = localStorage.getItem("activoActual");
      if (activo) guardarIntervaloActivo(activo, selectorIntervalo.value);
    });
  }
});

// ============================================================
// 🔵 VERIFICAR BACKEND
// ============================================================
async function verificarConexionBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}`);
    if (res.ok) console.log("🟢 Backend OK");
    else console.warn("⚠️ Backend no responde:", res.status);
  } catch (e) {
    console.error("❌ Error ping backend:", e.message);
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
      ${lista
        .map(
          (a) => `
        <button class="btn-activo" data-simbolo="${a.simbolo}">
          ${a.nombre}
        </button>`
        )
        .join("")}
    </div>
  `;

  document.querySelectorAll(".btn-activo").forEach((btn) => {
    btn.addEventListener("click", () => realizarAnalisis(btn.dataset.simbolo));
  });
}

// ============================================================
// 🧠 ANÁLISIS PRINCIPAL
// ============================================================
async function realizarAnalisis(simbolo) {
  if (analisisEnProgreso) return console.warn("⏳ Análisis ya corriendo...");
  analisisEnProgreso = true;
  setTimeout(() => (analisisEnProgreso = false), 4000);

  const estrategiasActivas = obtenerEstadoEstrategias();
  localStorage.setItem("estrategiasActivas", JSON.stringify(estrategiasActivas));
  localStorage.setItem("activoActual", simbolo);

  const intervalo = obtenerIntervaloActivo(simbolo);

  let cont = document.getElementById("contenedor-activos");
  if (!cont) {
    cont = document.createElement("div");
    cont.id = "contenedor-activos";
    document.body.appendChild(cont);
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/analisis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simbolo, intervalo, estrategiasActivas }),
    });

    const resultado = await res.json();

    if (!resultado.simbolo) {
      cont.innerHTML = `<p class="error">⚠️ Sin datos</p>`;
      return;
    }

    if (activoActual !== resultado.simbolo) {
      detenerParpadeo();
      activoActual = resultado.simbolo;
    }

    // Render de tarjeta principal
    cont.innerHTML = renderPanelDiagnostico(resultado);

    // Señal válida — el registro en historial lo hace el backend (motor.js)
    if (resultado.decision === "OPERAR" && resultado.entry && resultado.stop) {
      activarParpadeo(resultado.sentido);
    }
  } catch (e) {
    cont.innerHTML = `<p class="error">❌ Error: ${e.message}</p>`;
  }
}

// ============================================================
// 🔵 Ayuda visual: clase de color + flecha según tendencia
// ============================================================
function lecturaTendencia(trend) {
  if (trend === "ALCISTA" || trend === "Alcista") return { cls: "valor-alcista", flecha: "▲" };
  if (trend === "BAJISTA" || trend === "Bajista") return { cls: "valor-bajista", flecha: "▼" };
  return { cls: "valor-neutral", flecha: "" };
}

// ============================================================
// 🔵 PANEL DIAGNÓSTICO — CORREGIDO COMPLETO
// ============================================================
function renderPanelDiagnostico(resultado) {
  const diag = resultado.diagnostico || {};

  // 🔥 Normalización fuerte
// 🔥 Diagnóstico extendido REAL desde el backend — lectura de tendencia
// independiente (Donchian, Gann High/Low, Pivot Supertrend, Supertrend),
// siempre presente exista o no señal de entrada.
const dx = resultado.diagnosticoExtendido || {};

// Normalización fuerte para evitar valores vacíos
dx.donchian   = dx.donchian   ?? { trend: "—" };
dx.gann       = dx.gann       ?? { trend: "—", valor: null };
dx.pivot      = dx.pivot      ?? { trend: "—", valor: null };
dx.supertrend = dx.supertrend ?? { trend: "—", valor: null };
dx.adx        = dx.adx        ?? "—";
dx.bias       = dx.bias       ?? "—";

// Momentum y volatilidad toman primero diagnóstico extendido,
// luego diagnóstico base, luego fallback.
dx.momentum =
  dx.momentum ??
  resultado.diagnostico?.momentum ??
  "—";

dx.volatilidad =
  dx.volatilidad ??
  resultado.diagnostico?.volatilidad ??
  "—";

// FIX: si hay señal OPERAR, usar SOLO las razones del resultado
dx.razones =
  resultado.decision === "OPERAR"
    ? resultado.razones
    : dx.razones && dx.razones.length
    ? dx.razones
    : resultado.razones && resultado.razones.length
    ? resultado.razones
    : ["— No hubo señal válida"];


// Modo y velas
dx.modo        = dx.modo ?? "—";
dx.velasUsadas = dx.velasUsadas ?? resultado.diagnostico?.velas ?? "—";


  const razones = resultado.razones || [];

  const biasClass =
    dx.bias?.toLowerCase() === "buy"
      ? "etiqueta-buy"
      : dx.bias?.toLowerCase() === "sell"
      ? "etiqueta-sell"
      : "valor-neutral";

  const lecTendencia  = lecturaTendencia(diag.tendencia);
  const lecDonchian   = lecturaTendencia(dx.donchian.trend);
  const lecGann       = lecturaTendencia(dx.gann.trend);
  const lecPivot      = lecturaTendencia(dx.pivot.trend);
  const lecSupertrend = lecturaTendencia(dx.supertrend.trend);

  return `
  <section class="tarjeta-analisis">

    <!-- ENCABEZADO — activo/precio + sesión/intervalo/velas en una sola fila -->
    <div class="diag-header-top">
      <div class="diag-activo-wrap">
        <span class="diag-activo-icon">🏦</span>
        <span class="activo-bloque">${resultado.simbolo}</span>
        <span class="activo-precio">${resultado.precioActual}</span>
        <span class="estrategia-bloque estado ${
          resultado.tipoEntrada?.includes("Sell")
            ? "rojo"
            : resultado.tipoEntrada?.includes("Buy")
            ? "verde"
            : "gris"
        }">
          ${resultado.tipoEntrada || "—"}
        </span>
      </div>
      <div class="diag-contexto-top">
        <span class="ctx-item">🌐 <strong>Sesión:</strong> ${resultado.session || "—"}</span>
        <span class="ctx-item">⏱ <strong>Intervalo:</strong> ${resultado.intervalo || "—"}</span>
        <span class="ctx-item">🕯 <strong>Velas:</strong> ${diag.velas || dx.velasUsadas}</span>
      </div>
    </div>

    <!-- DIAGNÓSTICO TÉCNICO — tarjetas -->
    <div class="diag-grid">

      <div class="diag-card">
        <div class="diag-card-header">🎯 <span>Dirección del mercado</span></div>
        <div class="diag-card-row">
          <span class="diag-label">Tendencia</span>
          <span class="diag-value ${lecTendencia.cls}">${diag.tendencia ?? "—"} ${lecTendencia.flecha}</span>
        </div>
        <div class="diag-card-row">
          <span class="diag-label">Bias</span>
          <span class="diag-value ${biasClass}">${dx.bias}</span>
        </div>
        <div class="diag-card-row">
          <span class="diag-label">Donchian</span>
          <span class="diag-value ${lecDonchian.cls}">${dx.donchian.trend} ${lecDonchian.flecha}</span>
        </div>
        <div class="diag-card-row">
          <span class="diag-label">Gann H/L</span>
          <span class="diag-value ${lecGann.cls}">${dx.gann.trend} ${lecGann.flecha}</span>
        </div>
      </div>

      <div class="diag-card">
        <div class="diag-card-header">📈 <span>Estructura técnica</span></div>
        <div class="diag-card-row">
          <span class="diag-label">Línea Gann</span>
          <span class="diag-value">${dx.gann.valor ?? "—"}</span>
        </div>
        <div class="diag-card-row">
          <span class="diag-label">Pivot Supertrend</span>
          <span class="diag-value ${lecPivot.cls}">${dx.pivot.trend} ${lecPivot.flecha}</span>
        </div>
        <div class="diag-card-row">
          <span class="diag-label">Línea Pivot</span>
          <span class="diag-value">${dx.pivot.valor ?? "—"}</span>
        </div>
        <div class="diag-card-row">
          <span class="diag-label">Supertrend</span>
          <span class="diag-value ${lecSupertrend.cls}">${dx.supertrend.trend} ${lecSupertrend.flecha}</span>
        </div>
        <div class="diag-card-row">
          <span class="diag-label">Línea Supertrend</span>
          <span class="diag-value">${dx.supertrend.valor ?? "—"}</span>
        </div>
      </div>

      <div class="diag-card">
        <div class="diag-card-header">⚡ <span>Fuerza y volatilidad</span></div>
        <div class="diag-card-row">
          <span class="diag-label">ADX</span>
          <span class="diag-value">${dx.adx}</span>
        </div>
        <div class="diag-card-row">
          <span class="diag-label">Momentum</span>
          <span class="diag-value">${dx.momentum ?? diag.momentum ?? "—"}</span>
        </div>
        <div class="diag-card-row">
          <span class="diag-label">ATR</span>
          <span class="diag-value">${dx.volatilidad ?? diag.volatilidad ?? "—"}</span>
        </div>
      </div>

    </div>

        <!-- RAZONES -->
    <div class="linea-razones">
      <strong>🤖 Razones:</strong><br>
      ${
        dx.razones && dx.razones.length
          ? dx.razones.join("<br>")
          : "— No hubo señal válida"
      }
    </div>


  </section>
  `;
}

// ============================================================
// 🔴🟢 PARPADEO
// ============================================================
function activarParpadeo(sentido) {
  const panel = document.querySelector(".tarjeta-analisis");
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
  const panel = document.querySelector(".tarjeta-analisis");
  if (!panel) return;
  panel.classList.remove("parpadeo-buy", "parpadeo-sell");
  if (timeoutParpadeo) clearTimeout(timeoutParpadeo);
}

export { renderListaActivos, realizarAnalisis, realizarAnalisis as ejecutarAnalisisEstrategico };
