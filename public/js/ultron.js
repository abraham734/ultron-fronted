// === ultron.js ===
// Lógica principal del asistente ULTRÓN – Análisis Estratégico

import { activos } from "./data.js";
import { obtenerDatosOHLC } from "./api_twelvedata.js";
import {
  renderConfiguracionRapida,
  configurarEventoCalculo,
} from "./configuracionrapida.js";
import { renderSwitches } from "./switches.js";

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
});

// === Renderiza la lista de activos por categoría ===
function renderListaActivos(categoria) {
  const lista = activos[categoria];
  const contenedor = document.getElementById("contenedor-activos");
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

  // Escucha clics en los botones de activos
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
  // 🧩 Validación de símbolo
  if (!simbolo || simbolo.trim() === "") {
    console.warn("⚠️ No se recibió un símbolo válido:", simbolo);
    return;
  }

  // 🔧 Garantizar que el contenedor exista
  let contenedor = document.getElementById("contenedor-activos");
  if (!contenedor) {
    const nuevo = document.createElement("div");
    nuevo.id = "contenedor-activos";
    document.body.appendChild(nuevo);
    contenedor = nuevo;
    console.log("🧱 Contenedor creado dinámicamente (Vercel delay fix).");
  }

  contenedor.innerHTML = `<p>🔄 Obteniendo datos de mercado para <strong>${simbolo}</strong>...</p>`;

  try {
    const datos = await obtenerDatosOHLC(simbolo);

    if (
      !datos ||
      !datos.ultimoCierre ||
      !datos.simbolo ||
      !Array.isArray(datos.datos) ||
      datos.datos.length === 0
    ) {
      contenedor.innerHTML = `<p class="error">⚠️ No se encontraron datos válidos para ${simbolo}</p>`;
      console.warn("❗ Objeto de datos incompleto o inválido:", datos);
      return;
    }

    // Renderiza análisis con precio actual
    renderSeccionAnalisisConPrecio(simbolo, datos.ultimoCierre);
  } catch (error) {
    contenedor.innerHTML = `<p class="error">❌ Error al obtener datos: ${error.message}</p>`;
    console.error("❌ Error inesperado:", error);
  }
}

// === Renderiza sección principal con análisis ===
function renderSeccionAnalisisConPrecio(simbolo, precio) {
  const contenedor = document.getElementById("contenedor-activos");
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div class="ultron-bloque">
      ${renderTarjetaSenalActiva(simbolo, precio)}
      ${renderConfiguracionRapida(simbolo, precio)}
    </div>
  `;

  configurarEventoCalculo(simbolo, precio);
}

// === Tarjeta con información de la señal actual ===
function renderTarjetaSenalActiva(simbolo, precio = 1.00000) {
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

// === Formateo visual del símbolo ===
function formatearSimbolo(simbolo) {
  if (simbolo.length === 6) {
    return `${simbolo.slice(0, 3)}/${simbolo.slice(3, 6)}`;
  }
  return simbolo;
}

// === Detectar tamaño del pip según el activo ===
function getPipSize(simbolo) {
  simbolo = simbolo.toUpperCase();
  if (simbolo.includes("JPY")) return 0.01;
  if (simbolo === "XAUUSD") return 0.1;
  if (simbolo === "BTCUSD") return 1.0;
  return 0.0001;
}

export { obtenerPrecioDesdeAPI };

