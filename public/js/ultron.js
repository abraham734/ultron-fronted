// === ultron.js ===
// Lógica principal del asistente ULTRÓN – Optimizada para control de consumo API y estabilidad
// Fecha: 29/oct/2025 – Versión táctica con bloqueo 429 + anti-spam + desactivación SYNC_INIT

import { activos } from "./data.js";
import { renderConfiguracionRapida, configurarEventoCalculo } from "./configuracionrapida.js";
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

// === Evento principal al cargar el DOM ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Interfaz ULTRÓN cargada correctamente.");

  renderSwitches();
  cargarHistorialDesdeStorage();

  // 🚫 Se desactiva la sincronización SYNC_INIT para evitar llamadas innecesarias
  console.log("📭 Sincronización SYNC_INIT deshabilitada para reducir consumo API.");

  // 🎯 Listener del selector de intervalos
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

// === Verifica conexión con el backend ===
async function verificarConexionBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}`);
    if (res.ok) console.log("🟢 Backend ping exitoso:", res.status);
    else console.warn("⚠️ Backend no responde:", res.status);
  } catch (error) {
    console.error("❌ Error al hacer ping al backend:", error.message);
  }
}

// === Renderiza lista de activos por categoría ===
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
      const simbolo = btn.dataset.simbolo;
      console.log("🧩 Símbolo seleccionado:", simbolo);
      realizarAnalisis(simbolo);
    });
  });
}

// === Realiza análisis enviando estrategias activas e intervalo ===
async function realizarAnalisis(simbolo) {
  if (analisisEnProgreso) {
    console.warn("⏳ Análisis en progreso, espera unos segundos...");
    return;
  }
  if (modoAPILimitado) {
    console.warn(`🚫 API en modo limitado. Espera ${tiempoRestanteAPI} min antes de reintentar.`);
    alert(`⚠️ Has alcanzado el límite diario de la API. Intenta nuevamente después de las 6:00 p.m.`);
    return;
  }

  analisisEnProgreso = true;
  setTimeout(() => (analisisEnProgreso = false), 5000); // ⏱️ Enfriamiento de 5s

  const estrategiasActivas = obtenerEstadoEstrategias();
  localStorage.setItem("estrategiasActivas", JSON.stringify(estrategiasActivas));
  localStorage.setItem("activoActual", simbolo);

  const intervalo = obtenerIntervaloActivo(simbolo);
  console.log(`⏱️ Intervalo aplicado a ${simbolo}: ${intervalo}`);

  let contenedor = document.getElementById("contenedor-activos");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "contenedor-activos";
    document.body.appendChild(contenedor);
    console.log("🧱 Contenedor creado dinámicamente (Vercel delay fix).");
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/analisis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simbolo, intervalo, estrategiasActivas }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        activarModoAPILimitado();
      }
      throw new Error(`Error HTTP ${res.status}`);
    }

    const resultado = await res.json();

    if (resultado?.error?.includes("API limit")) {
      activarModoAPILimitado();
      contenedor.innerHTML = `<p class="error">🚫 Límite de API alcanzado. Intenta más tarde.</p>`;
      return;
    }

    if (!resultado || !resultado.simbolo) {
      contenedor.innerHTML = `<p class="error">⚠️ No se encontraron datos válidos para ${simbolo}</p>`;
      return;
    }

    // === Actualiza barra de escaneo ===
    let barra = document.querySelector(".barra-escaneo");
    if (!barra) {
      barra = document.createElement("div");
      barra.classList.add("barra-escaneo");
      const main = document.getElementById("contenedor-activos");
      if (main) main.insertAdjacentElement("beforebegin", barra);
      else document.body.prepend(barra);
    }

    const estrategiaTexto = obtenerNombreEstrategiaActiva(resultado.tipoEntrada);
    barra.textContent = `🔍 Escaneando: ${resultado.simbolo} – Estrategia: ${estrategiaTexto} [${intervalo}]`;

    // === Renderiza análisis + configuración ===
    contenedor.innerHTML = `
      <div class="ultron-bloque-wrapper">
        <div class="ultron-bloque">
          ${renderAnalisisEstrategico(resultado)}
          ${renderConfiguracionRapida(resultado.simbolo, resultado.entry || "1.0000")}
        </div>
      </div>
    `;

    configurarEventoCalculo(resultado.simbolo, resultado.entry || "1.0000");

      // ===============================
      // 🔍 Cargar diagnóstico del motor
     // ===============================
     await cargarDiagnosticoMotor(resultado.simbolo, resultado.intervalo); 
    // ===============================

    // === Guardar entrada válida en historial ===
    const datosCompletos =
      resultado.decision === "OPERAR" &&
      resultado.tipoEntrada &&
      resultado.stop && resultado.tp1 && resultado.tp2 && resultado.tp3 &&
      (resultado.entry || resultado.precioActual);

    if (datosCompletos) {
     registrarEntradaUltron({
  activo: resultado.simbolo,
  tipoEntrada: resultado.tipoEntrada,
  sentido: resultado.sentido || resultado.tipoOperacion || "-",   // Buy / Sell
  entry: resultado.entry || resultado.precioActual || "-",         // Precio real
  sl: resultado.stop,
  tp1: resultado.tp1,
  tp2: resultado.tp2,
  tp3: resultado.tp3,
  fechaHora: new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })
});

      console.log("🗃️ ✅ Entrada registrada:", resultado.simbolo);
    } else {
      console.log("🚫 Entrada omitida por datos incompletos:", resultado.simbolo);
    }

  } catch (error) {
    contenedor.innerHTML = `<p class="error">❌ Error al obtener datos desde backend: ${error.message}</p>`;
    console.error("❌ Error en análisis:", error);
  } finally {
    analisisEnProgreso = false;
  }
}

// === Activar modo de espera si se alcanza el límite de API ===
function activarModoAPILimitado() {
  modoAPILimitado = true;
  const ahora = new Date();
  const proximoResetUTC = new Date();
  proximoResetUTC.setUTCHours(0, 0, 0, 0); // corte 00:00 UTC
  if (ahora > proximoResetUTC) proximoResetUTC.setUTCDate(proximoResetUTC.getUTCDate() + 1);

  const minutosRestantes = Math.ceil((proximoResetUTC - ahora) / 60000);
  tiempoRestanteAPI = Math.max(minutosRestantes, 0);

  console.warn(`🚫 Límite de API alcanzado. Modo espera activo (${tiempoRestanteAPI} min hasta reset).`);
  alert("⚠️ Límite diario de API alcanzado. Ultron pausará peticiones hasta el próximo reinicio (6:00 p.m. CDMX).");
}

// === Mostrar estrategia activa aunque no haya señal ===
function obtenerNombreEstrategiaActiva(tipoEntrada) {
  if (tipoEntrada) return tipoEntrada;

  const estrategias = JSON.parse(localStorage.getItem("estrategiasActivas") || "{}");
  for (const [nombre, modo] of Object.entries(estrategias)) {
    if (modo && modo !== "OFF") {
      switch (nombre) {
        case "cambioCiclo": return "Reversión Institucional";
        case "cajaDarvas": return "Caja Darvas";
        case "tendencia": return "Continuación de Tendencia";
        case "supertrendDoble": return "Supertrend Doble";
        case "emaTriple": return "Triple EMA + ADX";
        default: return "Estrategia Activa";
      }
    }
  }
  return "Sin estrategia activa";
}

// === Renderiza bloque del Análisis Estratégico ===
function renderAnalisisEstrategico(resultado) {
  const simbolo = resultado.simbolo || "Activo desconocido";
  const precio = resultado.entry || resultado.precioActual || "Sin datos";
  const estrategia = obtenerNombreEstrategiaActiva(resultado.tipoEntrada);
  const decision = resultado.decision || "NEUTRO";
  const riesgo = resultado.riesgo || "Bajo";
  const sesion = resultado.session && resultado.session !== "undefined"
    ? resultado.session
    : "Fuera de horario / No disponible";
  const sl = resultado.stop || "-";
  const tp1 = resultado.tp1 || "-";
  const tp2 = resultado.tp2 || "-";
  const tp3 = resultado.tp3 || "-";
  const lectura = resultado.ultimaLectura || "BOS no validado";
  const razones = resultado.razones?.length ? resultado.razones.join(" + ") : "Sin razones disponibles";

  const colorDecision =
    decision === "OPERAR" ? "verde" :
    decision === "NO OPERAR" ? "rojo" : "gris";

  return `
    <div class="tarjeta-analisis">
      <h3>🧠 Análisis Estratégico ULTRÓN</h3>
      <div class="linea-principal">
        <div class="activo-bloque">
          <span class="etiqueta">Activo:</span> 
          <span class="activo-nombre">${simbolo}</span>
          <span class="activo-precio">${precio}</span>
        </div>
        <div class="estrategia-bloque">
          <span class="etiqueta">Estrategia:</span> 
          <span class="estrategia">${estrategia}</span> |
          <span class="etiqueta">Estado:</span> 
          <span class="estado ${colorDecision}">${decision}</span>
        </div>
      </div>
      <div class="linea-contexto">
        <span>Riesgo: <strong>${riesgo}</strong></span> |
        <span>Sesión: <strong>${sesion}</strong></span>
      </div>
      <div class="linea-niveles">
        <span class="sl">SL: <strong>${sl}</strong></span> |
        <span class="tp">TP1: <strong>${tp1}</strong></span> |
        <span class="tp">TP2: <strong>${tp2}</strong></span> |
        <span class="tp">TP3: <strong>${tp3}</strong></span>
      </div>
      <div class="linea-lectura">
        <span>📊 Última lectura:</span> 
        <span class="lectura">${lectura}</span>
      </div>
      <div class="linea-razones">
        <span>💬 ${razones}</span>
      </div>
      <div class="footer-analisis">
        <p><strong>Hora local:</strong> ${resultado.horaLocal || "No disponible"}</p>
      </div>
    </div>
  `;
}

// === Exportaciones ===
export { renderListaActivos, realizarAnalisis, realizarAnalisis as ejecutarAnalisisEstrategico };
