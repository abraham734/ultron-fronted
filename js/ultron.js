// === ultron.js ===
// Lógica principal del asistente ULTRÓN – Análisis Estratégico

import { activos } from "./data.js";
//import { motorDecisionUltron } from "./motor.js";//
import { obtenerDatosOHLC } from "./api_twelvedata.js";
import {
  renderConfiguracionRapida,
  configurarEventoCalculo,
} from "./configuracionrapida.js";
//import { verificarInicioDeSesion } from "./sesionesbot.js";//
//import { iniciarEscaneoAutomatico } from "./escaneoautomatico.js";//
import { renderSwitches } from "./switches.js";
//import { verificarEstadoSistema } from "./utils/estadosistema.js";//
//import "./escaneoentradas.js";//



// Evento principal al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  verificarEstadoSistema(); // 🟢 Verifica estado real del backend al iniciar

  renderSwitches(); // 🔛 Activa switches al cargar la app
  const botonAnalisis = document.getElementById("boton-iniciar-analisis");

  if (botonAnalisis) {
    botonAnalisis.addEventListener("click", () => {
      renderListaActivos("forex");
    });
  }

  iniciarEscaneoAutomatico(); // ✅ Escaneo automático
});
// Verificación periódica de sesión
setInterval(() => {
  verificarInicioDeSesion();
}, 1000 * 60 * 5); // Cada 5 minutos





// === Renderiza la lista de activos de una categoría ===
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
      obtenerPrecioDesdeAPI(simbolo);
    });
  });
}

// === Obtener precio desde la API
async function obtenerPrecioDesdeAPI(simbolo) {
  const contenedor = document.getElementById("activos-container");
  contenedor.innerHTML = `<p>🔄 Obteniendo datos de mercado...</p>`;

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

    renderSeccionAnalisisConPrecio(simbolo, datos.ultimoCierre);
    const decision = motorDecisionUltron(simbolo, datos);

    if (!decision) {
      contenedor.innerHTML += `<p class="error">⚠️ No se pudo calcular la decisión estratégica.</p>`;
      return;
    }

    renderDecisionUltron(decision);
  } catch (error) {
    contenedor.innerHTML = `<p class="error">❌ Error al obtener datos: ${error.message}</p>`;
    console.error("❌ Error inesperado:", error);
  }
}

// === Renderiza análisis con precio real
function renderSeccionAnalisisConPrecio(simbolo, precio) {
  const contenedor = document.getElementById("activos-container");
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div class="ultron-bloque">
      ${renderTarjetaSenalActiva(simbolo, precio)}
      <div id="bloque-decision-placeholder"></div>
      ${renderConfiguracionRapida()}
    </div>
  `;

  configurarEventoCalculo(simbolo, precio);
}

// === Tarjeta de señal activa
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

// === Formateo de símbolo
function formatearSimbolo(simbolo) {
  if (simbolo.length === 6) {
    return `${simbolo.slice(0, 3)}/${simbolo.slice(3, 6)}`;
  }
  return simbolo;
}

// === Detectar tamaño del pip
function getPipSize(simbolo) {
  simbolo = simbolo.toUpperCase();
  if (simbolo.includes("JPY")) return 0.01;
  if (simbolo === "XAUUSD") return 0.1;
  if (simbolo === "BTCUSD") return 1.0;
  return 0.0001;
}

// === Mostrar decisión de Ultron
function renderDecisionUltron(decision) {
  const placeholder = document.getElementById("bloque-decision-placeholder");
  if (!placeholder) return;

  const razonesHTML = decision.razones.map(r => `<li>${r}</li>`).join("");

  placeholder.outerHTML = `
    <div class="decision-ultron">
      <h3>🧠 Análisis Estratégico ULTRON</h3>
      <p><strong>Decisión:</strong> ${decision.decision}</p>
      <p><strong>Tipo de Entrada:</strong> ${decision.tipoEntrada ?? "N/A"}</p>
      <p><strong>Riesgo:</strong> ${decision.riesgo}</p>
      <ul>${razonesHTML}</ul>
    </div>
  `;
}

export { obtenerPrecioDesdeAPI };

setInterval(() => {
  verificarEstadoSistema();
}, 1000 * 60 * 5); // Cada 5 minutos



