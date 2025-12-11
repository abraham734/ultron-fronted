// === ultron.js ===
// Lógica principal del asistente ULTRÓN – Optimizada para control de consumo API y estabilidad
// Versión extendida con Panel Diagnóstico Live + Parpadeo BUY/SELL

import { activos } from "./data.js";
import { renderSwitches, obtenerEstadoEstrategias } from "./switches.js";
import { obtenerIntervaloActivo, guardarIntervaloActivo } from "./intervalosporactivo.js";
import { cargarDiagnosticoMotor } from "./diagnostico_motor.js";
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

    // Diagnóstico motor original
    await cargarDiagnosticoMotor(resultado.simbolo, resultado.intervalo);

    // Registrar señal válida
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
        fechaHora: new Date().toLocaleString("es-MX", {
          timeZone: "America/Mexico_City",
        }),
      });

      activarParpadeo(resultado.sentido);
    }
  } catch (e) {
    cont.innerHTML = `<p class="error">❌ Error: ${e.message}</p>`;
  }
}

// ============================================================
// 🔵 PANEL DIAGNÓSTICO — CORREGIDO COMPLETO
// ============================================================
function renderPanelDiagnostico(resultado) {
  const diag = resultado.diagnostico || {};

  // 🔥 Normalización fuerte
// 🔥 Diagnóstico extendido REAL desde el backend
const dx = resultado.diagnosticoExtendido || {};

// Normalización fuerte para evitar valores vacíos
dx.supertrendRapido = dx.supertrendRapido ?? "—";
dx.supertrendLento  = dx.supertrendLento  ?? "—";
dx.swing            = dx.swing            ?? "—";
dx.ruptura          = dx.ruptura          ?? "—";
dx.adx              = dx.adx              ?? "—";
dx.bias             = dx.bias             ?? "—";

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

// Razones reales desde la estrategia
dx.razones =
  dx.razones && dx.razones.length
    ? dx.razones
    : resultado.razones && resultado.razones.length
    ? resultado.razones
    : ["— No hubo señal válida"];

// Modo y velas
dx.modo        = dx.modo ?? "—";
dx.velasUsadas = dx.velasUsadas ?? resultado.diagnostico?.velas ?? "—";


  const sq = resultado.squeeze || {};
  const razones = resultado.razones || [];

  const tendenciaClass =
    diag.tendencia === "Alcista"
      ? "valor-alcista"
      : diag.tendencia === "Bajista"
      ? "valor-bajista"
      : "valor-neutral";

  const biasClass =
    dx.bias?.toLowerCase() === "buy"
      ? "etiqueta-buy"
      : dx.bias?.toLowerCase() === "sell"
      ? "etiqueta-sell"
      : "valor-neutral";

  return `
  <section class="tarjeta-analisis">

    <!-- LÍNEA PRINCIPAL -->
    <div class="linea-principal">
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

    <!-- CONTEXTO -->
    <div class="linea-contexto">
      🌐 <strong>Sesión:</strong> ${resultado.session || "—"} &nbsp; | &nbsp;
      ⏱ <strong>Intervalo:</strong> ${resultado.intervalo || "—"} &nbsp; | &nbsp;
      🕯 <strong>Velas:</strong> ${diag.velas || resultado?.diagnosticoExtendido?.velasUsadas}
    </div>

    <!-- DIAGNÓSTICO TÉCNICO -->
<div class="linea-lectura">
  🧭 Tendencia: <strong class="${tendenciaClass}">
    ${diag.tendencia ?? "—"}
  </strong> &nbsp; | &nbsp;

  ⚡ Momentum: <strong>
    ${dx.momentum ?? diag.momentum ?? "—"}
  </strong> &nbsp; | &nbsp;

  🌪 ATR: <strong>
    ${dx.volatilidad ?? diag.volatilidad ?? "—"}
  </strong> &nbsp; | &nbsp;

  🟣 Squeeze: <span class="etiqueta-sq">
    ${sq.squeezeOn ? "ON" : "OFF"}
  </span>
</div>


    <!-- DIAGNÓSTICO INSTITUCIONAL -->
    <div class="linea-lectura">
      📈 ST Rápido: <strong>${dx.supertrendRapido}</strong> &nbsp; | &nbsp;
      📉 ST Lento: <strong>${dx.supertrendLento}</strong> &nbsp; | &nbsp;
      🎯 SWING: <strong>${dx.swing}</strong> &nbsp; | &nbsp;
      🚨 Ruptura: <strong>${dx.ruptura}</strong>
    </div>

    <div class="linea-lectura">
      📡 ADX: <strong>${dx.adx}</strong> &nbsp; | &nbsp;
      🌀 Bias: <span class="${biasClass}">${dx.bias}</span> &nbsp; | &nbsp;
      📊 Mom. Squeeze: <strong>${sq.momentum ?? "—"}</strong>
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
