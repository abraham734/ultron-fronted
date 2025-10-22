// === ultron.js ===
// Lógica principal del asistente ULTRÓN – Análisis Estratégico

import { activos } from "./data.js";
import { renderConfiguracionRapida, configurarEventoCalculo } from "./configuracionrapida.js";
import { renderSwitches, obtenerEstadoEstrategias } from "./switches.js";
import { cargarHistorialDesdeStorage, registrarEntradaUltron } from "./historial.js"; // ✅ Integración historial

// === URL dinámica del backend ===
const BACKEND_URL = window.location.hostname.includes("vercel.app")
  ? "https://ultron-backend-zvtm.onrender.com"
  : "http://127.0.0.1:3000";

// === Evento principal al cargar el DOM ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Interfaz ULTRÓN cargada correctamente.");

  renderSwitches();
  cargarHistorialDesdeStorage(); // ✅ Carga historial guardado

  const botonAnalisis = document.getElementById("boton-iniciar-analisis");
  if (botonAnalisis) {
    botonAnalisis.addEventListener("click", () => {
      renderListaActivos("forex");
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
      ${lista
        .map(
          (activo) => `
            <button class="btn-activo" data-simbolo="${activo.simbolo}">
              ${activo.nombre}
            </button>
          `
        )
        .join("")}
    </div>
  `;

  document.querySelectorAll(".btn-activo").forEach((btn) => {
    btn.addEventListener("click", () => {
      const simbolo = btn.dataset.simbolo;
      console.log("🧩 Símbolo seleccionado:", simbolo);
      realizarAnalisis(simbolo); // 👈 Llama al flujo principal
    });
  });
}

// === Realiza análisis enviando estrategias activas ===
async function realizarAnalisis(simbolo) {
  const estrategiasActivas = obtenerEstadoEstrategias();

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
      body: JSON.stringify({ simbolo, estrategiasActivas }),
    });

    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    const resultado = await res.json();

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

    barra.textContent = `🔍 Escaneando: ${resultado.simbolo} – Estrategia: ${resultado.tipoEntrada || "Sin estrategia activa"}`;

    // === Renderiza módulos principales ===
    contenedor.innerHTML = `
      <div class="ultron-bloque-wrapper">
        <div class="ultron-bloque">
          ${renderTarjetaSenalActiva(resultado.simbolo, resultado.entry || "1.0000")}
          ${renderAnalisisEstrategico(resultado)}
          ${renderConfiguracionRapida(resultado.simbolo, resultado.entry || "1.0000")}
        </div>
      </div>
    `;

    configurarEventoCalculo(resultado.simbolo, resultado.entry || "1.0000");

    // === 🧠 Registrar entrada válida en historial ===
    if (resultado.decision === "OPERAR" || resultado.tipoEntrada) {
      registrarEntradaUltron({
        activo: resultado.simbolo,
        tipoEntrada: resultado.tipoEntrada || "Desconocido",
        sl: resultado.stop || "-",
        tp1: resultado.tp1 || "-",
        tp2: resultado.tp2 || "-",
        tp3: resultado.tp3 || "-",
        fechaHora: new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" }),
      });
      console.log("🗃️ Entrada registrada en historial:", resultado.simbolo);
    }

  } catch (error) {
    contenedor.innerHTML = `<p class="error">❌ Error al obtener datos desde backend: ${error.message}</p>`;
    console.error("❌ Error en análisis:", error);
  }
}

// === Renderiza la tarjeta de señal activa ===
function renderTarjetaSenalActiva(simbolo, precio = 1.0) {
  const pipSize = getPipSize(simbolo);
  const precioNum = parseFloat(precio);
  const sl = (precioNum - 50 * pipSize).toFixed(5);
  const tp1 = (precioNum + 50 * pipSize).toFixed(5);
  const tp2 = (precioNum + 80 * pipSize).toFixed(5);
  const tp3 = (precioNum + 100 * pipSize).toFixed(5);

  return `
    <div class="tarjeta-senal">
      <h3>📡 Señal Activa</h3>
      <p><strong>Activo:</strong> ${formatearSimbolo(simbolo)}</p>
      <p><strong>Precio Actual:</strong> ${precioNum}</p>
      <p><strong>SL:</strong> ${sl} <span class="gris">(50 pips abajo)</span></p>
      <p><strong>TP1:</strong> ${tp1} <span class="gris">(50 pips arriba)</span></p>
      <p><strong>TP2:</strong> ${tp2} <span class="gris">(80 pips arriba)</span></p>
      <p><strong>TP3:</strong> ${tp3} <span class="gris">(100 pips arriba)</span></p>
      <p><strong>Estado:</strong> 🟢 Activo</p>
    </div>
  `;
}

// === Renderiza la tarjeta de análisis estratégico ===
function renderAnalisisEstrategico(resultado) {
  return `
    <div class="tarjeta-analisis">
      <h3>🧠 Análisis Estratégico ULTRÓN</h3>
      <p><strong>Decisión:</strong> ${resultado.decision || "N/A"}</p>
      <p><strong>Tipo de Entrada:</strong> ${resultado.tipoEntrada || "N/A"}</p>
      <p><strong>Riesgo:</strong> ${resultado.riesgo || "bajo"}</p>
      ${
        resultado.razones?.length
          ? `<ul>${resultado.razones.map((r) => `<li>${r}</li>`).join("")}</ul>`
          : `<p>⚠️ Sin razones disponibles.</p>`
      }

      <div class="footer-analisis">
        <p>📊 <strong>Sesión:</strong> ${resultado.session || "Desconocida"}</p>
        <p>🕒 <strong>Hora local:</strong> ${resultado.horaLocal || "No disponible"}</p>
      </div>
    </div>
  `;
}


// === Utilidades ===
function formatearSimbolo(simbolo) {
  if (simbolo.length === 6) return `${simbolo.slice(0, 3)}/${simbolo.slice(3, 6)}`;
  return simbolo;
}

function getPipSize(simbolo) {
  simbolo = simbolo.toUpperCase();
  if (simbolo.includes("JPY")) return 0.01;
  if (simbolo === "XAUUSD") return 0.1;
  if (simbolo === "BTCUSD") return 1.0;
  return 0.0001;
}

// === Exportaciones ===
export { realizarAnalisis, realizarAnalisis as ejecutarAnalisisEstrategico };
