// === ultron.js ===
// Lógica principal del asistente ULTRÓN – Análisis Estratégico

import { activos } from "./data.js";
import { obtenerDatosOHLC } from "./api_twelvedata.js";
import {
  renderConfiguracionRapida,
  configurarEventoCalculo,
} from "./configuracionrapida.js";
import { renderSwitches } from "./switches.js";


// === URL dinámica del backend ===
const BACKEND_URL = window.location.hostname.includes("vercel.app")
  ? "https://ultron-backend-zvtm.onrender.com"
  : "http://127.0.0.1:3000";

// === Evento principal al cargar el DOM ===


document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Interfaz ULTRÓN cargada correctamente.");

  // Activa los switches de estrategias
  renderSwitches();

  const botonAnalisis = document.getElementById("boton-iniciar-analisis");
  if (botonAnalisis) {
    botonAnalisis.addEventListener("click", () => {
      renderListaActivos("forex");
    });
  }

  // Verifica conexión con backend
  verificarConexionBackend();

  // 🔁 Inicia escaneo automático continuo cada minuto
    
});


// === Verifica conexión con el backend (ping test) ===
async function verificarConexionBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}`);
    if (res.ok) console.log("🟢 Backend ping exitoso:", res.status);
    else console.warn("⚠️ Backend no responde:", res.status);
  } catch (error) {
    console.error("❌ Error al hacer ping al backend:", error.message);
  }
}

// === Renderiza la lista de activos por categoría ===
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
      obtenerPrecioDesdeAPI(simbolo);
    });
  });
}

// === Obtener precio desde la API ===
async function obtenerPrecioDesdeAPI(simbolo) {
  if (!simbolo || simbolo.trim() === "") {
    console.warn("⚠️ No se recibió un símbolo válido:", simbolo);
    return;
  }

  let contenedor = document.getElementById("contenedor-activos");
  if (!contenedor) {
    const nuevo = document.createElement("div");
    nuevo.id = "contenedor-activos";
    document.body.appendChild(nuevo);
    contenedor = nuevo;
    console.log("🧱 Contenedor creado dinámicamente (Vercel delay fix).");
  }

  //contenedor.innerHTML = `<p>🔄 Escaneando <strong>${simbolo}</strong>...</p>`;//

  try {
    // === Llamado al backend Render ===
    const res = await fetch(`${BACKEND_URL}/api/analisis?simbolo=${simbolo}`);

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status} al conectar con backend`);
    }

    const resultado = await res.json();

    // === Validación de datos del backend ===
    if (!resultado || !resultado.simbolo) {
      contenedor.innerHTML = `<p class="error">⚠️ No se encontraron datos válidos para ${simbolo}</p>`;
      console.warn("❗ Objeto de datos incompleto o inválido:", resultado);
      return;
    }

    // === Crea o actualiza la barra de escaneo ===
    let barra = document.querySelector(".barra-escaneo");
    if (!barra) {
      barra = document.createElement("div");
      barra.classList.add("barra-escaneo");
      const main = document.getElementById("contenedor-activos");
      if (main) {
        main.insertAdjacentElement("beforebegin", barra);
      } else {
        document.body.prepend(barra);
      }
    }
    barra.textContent = `🔍 Escaneando: ${resultado.simbolo} – Estrategia: ${resultado.tipoEntrada || "Sin estrategia activa"}`;

    // === Renderiza los módulos principales ===
    contenedor.innerHTML += `
      <div class="ultron-bloque-wrapper">
        <div class="ultron-bloque">
          ${renderTarjetaSenalActiva(resultado.simbolo, resultado.entry || "1.0000")}
          ${renderAnalisisEstrategico(resultado)}
          ${renderConfiguracionRapida(resultado.simbolo, resultado.entry || "1.0000")}
        </div>
      </div>
    `;

    configurarEventoCalculo(resultado.simbolo, resultado.entry || "1.0000");

  } catch (error) {
    contenedor.innerHTML = `<p class="error">❌ Error al obtener datos desde backend: ${error.message}</p>`;
    console.error("❌ Error al obtener datos backend:", error);
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
      <p><strong>Decisión:</strong> ${resultado.decision}</p>
      <p><strong>Tipo de Entrada:</strong> ${resultado.tipoEntrada || "N/A"}</p>
      <p><strong>Riesgo:</strong> ${resultado.riesgo || "bajo"}</p>
      ${
        resultado.razones && resultado.razones.length > 0
          ? `<ul>${resultado.razones.map((r) => `<li>${r}</li>`).join("")}</ul>`
          : `<p>⚠️ Sin razones disponibles.</p>`
      }
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

export { obtenerPrecioDesdeAPI };
