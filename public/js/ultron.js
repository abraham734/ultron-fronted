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

    // === Renderiza bloques principales (ahora unificados) ===
    contenedor.innerHTML = `
      <div class="ultron-bloque-wrapper">
        <div class="ultron-bloque">
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

// === Renderiza bloque unificado: Análisis Estratégico ULTRÓN ===
function renderAnalisisEstrategico(resultado) {
  const simbolo = resultado.simbolo || "Activo desconocido";
  const precio = resultado.entry || resultado.precioActual || "⚠️ Sin datos válidos";
  const sl = resultado.stop || "-";
  const tp1 = resultado.tp1 || "-";
  const tp2 = resultado.tp2 || "-";
  const tp3 = resultado.tp3 || "-";

  const claseDecision =
    resultado.decision === "OPERAR" ? "verde" :
    resultado.decision === "NO OPERAR" ? "rojo" : "amarillo";

  return `
    <div class="tarjeta-analisis">
      <h3>🧠 Análisis Estratégico ULTRÓN</h3>

      <!-- === Primera fila: activo y estado === -->
      <div class="fila-analisis">
        <div class="campo">
          <label>Activo:</label>
          <span class="valor">${simbolo}</span>
        </div>
        <div class="campo">
          <label>Precio Actual:</label>
          <span class="valor ${precio.includes("⚠️") ? "rojo" : "verde"}">${precio}</span>
        </div>
        <div class="campo">
          <label>Estado:</label>
          <span class="valor ${claseDecision}">
            ${resultado.decision || "Neutro"}
          </span>
        </div>
        <div class="campo">
          <label>Estrategia:</label>
          <span class="valor">${resultado.tipoEntrada || "Sin estrategia"}</span>
        </div>
      </div>

      <!-- === Segunda fila: estructura táctica === -->
      <div class="fila-analisis">
        <div class="campo">
          <label>Riesgo:</label>
          <span class="valor">${resultado.riesgo || "Bajo"}</span>
        </div>
        <div class="campo">
          <label>Estructura:</label>
          <span class="valor">${resultado.estructura || "No confirmada"}</span>
        </div>
        <div class="campo">
          <label>Volumen:</label>
          <span class="valor">${resultado.volumen || "Bajo"}</span>
        </div>
        <div class="campo">
          <label>Sesión:</label>
          <span class="valor">${resultado.session || "Desconocida"}</span>
        </div>
      </div>

      <!-- === Tercera fila: lectura rápida === -->
      <div class="fila-lectura">
        <label>📊 Última Lectura:</label>
        <span class="valor">${resultado.ultimaLectura || "BOS no validado"}</span>
      </div>

      <!-- === Cuarta fila: niveles detectados === -->
      <div class="fila-niveles">
        <span class="nivel rojo">SL: ${sl}</span>
        <span class="nivel verde">TP1: ${tp1}</span>
        <span class="nivel verde">TP2: ${tp2}</span>
        <span class="nivel verde">TP3: ${tp3}</span>
      </div>

      <!-- === Quinta fila: razones === -->
      <div class="bloque-razones">
        <h4>💬 Razones del Análisis</h4>
        <ul>
          ${
            resultado.razones?.length
              ? resultado.razones.map(r => `<li>${r}</li>`).join("")
              : "<li class='warn'>Sin razones disponibles</li>"
          }
        </ul>
      </div>

      <!-- === Footer === -->
      <div class="footer-analisis">
        <p><strong>Hora local:</strong> ${resultado.horaLocal || "No disponible"}</p>
        <p><strong>Última actualización:</strong> hace 1 min</p>
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
