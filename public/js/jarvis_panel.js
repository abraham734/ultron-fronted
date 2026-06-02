// === jarvis_panel.js ===
// ============================================================
// 🔱 Jarvis – Oro Pro (HFv4.0 + Historial de Rentabilidad)
// Panel táctico con:
//   - Lectura de mercado en tiempo real
//   - Estado de señal activa
//   - Métricas de rentabilidad (win rate, P&L, racha)
//   - Historial de señales con resultado (TP/SL/Timeout/Activa)
// ============================================================

const JARVIS_BACKEND = window.location.hostname.includes("vercel.app")
  ? "https://ultron-backend-zvtm.onrender.com"
  : "http://127.0.0.1:3000";

// ============================================================
// 🏗️ RENDER DEL PANEL PRINCIPAL
// ============================================================
function renderJarvisPanel() {
  const contenedor = document.getElementById("jarvis-panel");
  if (!contenedor) return;
  if (contenedor.dataset.rendered === "1") return;

  contenedor.innerHTML = `
    <div class="jarvis-header">
      <h2>🧠 Jarvis – Oro Pro</h2>
      <div id="jarvis-status" class="jarvis-status">
        <span id="jarvis-indicador" class="indicador offline"></span>
        <span id="jarvis-estado-texto" class="estado-texto">Sin conexión</span>
      </div>
    </div>

    <div class="jarvis-body borde-chispa">

      <!-- BLOQUE A – Lectura del Mercado -->
      <div class="jarvis-box" id="lectura-mercado">
        <h3>Lectura del Mercado</h3>
        <p id="lm-xau">XAU/USD: Esperando datos…</p>
        <p id="lm-tendencia">Tendencia 5m: —</p>
        <p id="lm-patron">Patrón 1m: —</p>
      </div>

      <!-- BLOQUE B – Estado de Señal -->
      <div class="jarvis-box" id="estado-senal">
        <h3>Estado de Señal</h3>
        <p id="es-condiciones">Analizando...</p>
        <p id="es-proxima">—</p>
      </div>

      <!-- BLOQUE C – Última Operación -->
      <div class="jarvis-box" id="ultima-operacion">
        <h3>Última Operación</h3>
        <div id="uo-info">Sin operaciones recientes.</div>
      </div>

      <!-- BLOQUE D – Estado del Sistema -->
      <div class="jarvis-box" id="estado-sistema">
        <h3>Estado del Sistema</h3>
        <p id="sis-sesion">—</p>
        <p id="sis-hora">—</p>
        <p id="sis-api">—</p>
      </div>

    </div>

    <!-- ================================================== -->
    <!-- SECCIÓN DE RENTABILIDAD (NUEVA)                     -->
    <!-- ================================================== -->
    <div class="jarvis-rentabilidad">

      <!-- Fila de métricas -->
      <div class="jarvis-metricas-grid">
        <div class="jm-card">
          <span class="jm-label">Señales totales</span>
          <span class="jm-valor" id="jm-total">—</span>
        </div>
        <div class="jm-card">
          <span class="jm-label">Win rate</span>
          <span class="jm-valor verde" id="jm-winrate">—</span>
        </div>
        <div class="jm-card">
          <span class="jm-label">P&amp;L acumulado</span>
          <span class="jm-valor" id="jm-pnl">—</span>
        </div>
        <div class="jm-card">
          <span class="jm-label">Racha actual</span>
          <span class="jm-valor" id="jm-racha">—</span>
        </div>
      </div>

      <!-- Filtro de semana -->
      <div class="jarvis-filtros">
        <label for="jarvis-selector-semana">Semana:</label>
        <select id="jarvis-selector-semana"></select>
        <button id="jarvis-btn-semana-actual">Semana actual</button>
      </div>

      <!-- Tabla de señales -->
      <div class="jarvis-tabla-wrapper">
        <table class="jarvis-tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Lado</th>
              <th>Entry</th>
              <th>TP</th>
              <th>SL</th>
              <th>Resultado</th>
              <th>PnL (USD)</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody id="jarvis-tabla-body">
            <tr>
              <td colspan="8" class="jarvis-tabla-vacia">Cargando historial...</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  `;

  contenedor.dataset.rendered = "1";
  iniciarMonitoreoJarvis();
  iniciarHistorialJarvis();
}

// ============================================================
// 🔄 MONITOREO EN TIEMPO REAL (estado + mercado)
// ============================================================
async function verificarEstadoJarvis() {
  try {
    const res = await fetch(`${JARVIS_BACKEND}/status_jarvis`);
    const data = await res.json();

    actualizarEstadoVisual(data);
    actualizarLecturaMercado(data);
    actualizarEstadoSenal(data);
    actualizarUltimaOperacion(data);
    actualizarEstadoSistema(data);

  } catch (err) {
    console.error("❌ Error conexión Jarvis:", err.message);
  }
}

// ============================================================
// 🟢🔴 VISUAL: ONLINE / OFFLINE / WARN
// ============================================================
function actualizarEstadoVisual(data) {
  const indicador = document.getElementById("jarvis-indicador");
  const texto     = document.getElementById("jarvis-estado-texto");
  const panel     = document.querySelector(".borde-chispa");
  if (!indicador || !data.estado) return;

  const mapa = {
    ONLINE:          { clase: "online",   label: "Online" },
    FUERA_DE_SESION: { clase: "fuera",    label: "Fuera de sesión" },
    SIN_DATOS:       { clase: "warn",     label: "Sin datos" },
    VOLATILIDAD_ALTA:{ clase: "warn",     label: "Volatilidad alta" },
  };

  const est = mapa[data.estado] || { clase: "offline", label: "Offline" };
  indicador.className = `indicador ${est.clase}`;
  texto.textContent   = est.label;

  if (panel) {
    panel.classList.toggle("activo", data.estado === "ONLINE");
    panel.classList.toggle("error",  data.estado === "ERROR");
  }
}

// ============================================================
// 📊 BLOQUE A – LECTURA DEL MERCADO
// ============================================================
function actualizarLecturaMercado(data) {
  const xau      = document.getElementById("lm-xau");
  const tendencia = document.getElementById("lm-tendencia");
  const patron   = document.getElementById("lm-patron");
  if (!xau) return;

  const precio = data.lectura?.precioXAU || "—";
  xau.textContent      = `XAU/USD → ${precio} USD`;
  tendencia.textContent = `Tendencia 5m: ${data.lectura?.tendencia5m || "—"}`;
  patron.textContent    = `Patrón 1m: ${data.lectura?.patron1m || "—"}`;
}

// ============================================================
// 🎯 BLOQUE B – ESTADO DE SEÑAL
// ============================================================
function actualizarEstadoSenal(data) {
  const cond = document.getElementById("es-condiciones");
  const prox = document.getElementById("es-proxima");
  if (!cond) return;

  cond.textContent = data.senalHF?.condiciones || "Analizando...";
  prox.textContent = data.senalHF?.proxima     || "—";
}

// ============================================================
// 📋 BLOQUE C – ÚLTIMA OPERACIÓN
// ============================================================
function actualizarUltimaOperacion(data) {
  const uo = document.getElementById("uo-info");
  if (!uo) return;

  if (!data.ultimaOperacion) {
    uo.textContent = "Sin operaciones recientes.";
    return;
  }

  const op         = data.ultimaOperacion;
  const ladoClass  = op.tipo === "BUY" ? "jarvis-badge-buy" : "jarvis-badge-sell";
  const resClass   = op.resultado === "TP" ? "jarvis-res-tp"
                   : op.resultado === "SL" ? "jarvis-res-sl"
                   : "jarvis-res-timeout";
  const pnlClass   = (op.pnl >= 0) ? "jarvis-pnl-pos" : "jarvis-pnl-neg";
  const pnlTexto   = op.pnl != null ? `${op.pnl >= 0 ? "+" : ""}${parseFloat(op.pnl).toFixed(3)} USD` : "—";

  uo.innerHTML = `
    <div class="uo-fila">
      <span class="jarvis-badge ${ladoClass}">${op.tipo}</span>
      <span class="${resClass}">${op.resultado || "—"}</span>
      <span class="${pnlClass}">${pnlTexto}</span>
    </div>
    <div class="uo-detalle">
      Entry: <strong>${op.entry}</strong> &nbsp;·&nbsp;
      TP: <strong>${op.tp}</strong> &nbsp;·&nbsp;
      SL: <strong>${op.sl}</strong>
    </div>
  `;
}

// ============================================================
// ⚙️ BLOQUE D – ESTADO DEL SISTEMA
// ============================================================
function actualizarEstadoSistema(data) {
  const sesion = document.getElementById("sis-sesion");
  const hora   = document.getElementById("sis-hora");
  const api    = document.getElementById("sis-api");
  if (!sesion) return;

  sesion.textContent = `Sesión: ${data.sesion  || "—"}`;
  hora.textContent   = `Hora UTC: ${data.horaUTC || "—"}`;
  api.textContent    = `API: ${data.api         || "OK"}`;
}

// ============================================================
// 📈 HISTORIAL DE RENTABILIDAD
// ============================================================

// Semana ISO actual
function obtenerSemanaActual() {
  const hoy   = new Date();
  const año   = hoy.getUTCFullYear();
  const inicio = new Date(Date.UTC(año, 0, 1));
  const diff  = (hoy - inicio) / 86400000;
  const semana = Math.ceil((diff + inicio.getUTCDay() + 1) / 7);
  return `${año}-W${semana}`;
}

// Cargar métricas globales desde /stats
async function cargarMetricasJarvis() {
  try {
    const res  = await fetch(`${JARVIS_BACKEND}/api/historial-jarvis/stats`);
    const data = await res.json();

    const total   = document.getElementById("jm-total");
    const winrate = document.getElementById("jm-winrate");
    const pnl     = document.getElementById("jm-pnl");
    const racha   = document.getElementById("jm-racha");
    if (!total) return;

    total.textContent   = data.total ?? "—";
    winrate.textContent = data.winRate != null ? `${data.winRate}%` : "—";
    winrate.className   = `jm-valor ${data.winRate >= 50 ? "verde" : "rojo"}`;

    const pnlVal = data.pnlTotal ?? null;
    pnl.textContent = pnlVal != null ? `${pnlVal >= 0 ? "+" : ""}${pnlVal.toFixed(2)} USD` : "—";
    pnl.className   = `jm-valor ${pnlVal >= 0 ? "verde" : "rojo"}`;

    const r = data.rachaActual ?? 0;
    racha.textContent = r > 0 ? `+${r} ganadoras` : r < 0 ? `${r} perdedoras` : "—";
    racha.className   = `jm-valor ${r > 0 ? "verde" : r < 0 ? "rojo" : ""}`;

  } catch (err) {
    console.error("❌ Error cargando métricas Jarvis:", err.message);
  }
}

// Inicializar selector de semanas
async function inicializarSelectorSemanas() {
  try {
    const res = await fetch(`${JARVIS_BACKEND}/api/historial-jarvis`);
    const db  = await res.json();
    const sel = document.getElementById("jarvis-selector-semana");
    if (!sel) return;

    const semanas = Object.keys(db).sort().reverse();
    sel.innerHTML = "";

    if (semanas.length === 0) {
      sel.innerHTML = `<option value="">Sin semanas</option>`;
      return;
    }

    semanas.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      sel.appendChild(opt);
    });

    const actual = obtenerSemanaActual();
    sel.value = semanas.includes(actual) ? actual : semanas[0];

    await cargarSemanaJarvis(sel.value);

  } catch (err) {
    console.error("❌ Error inicializando selector semanas Jarvis:", err.message);
  }
}

// Cargar señales de una semana y renderizar tabla
async function cargarSemanaJarvis(claveSemana) {
  try {
    const [año, semana] = claveSemana.split("-W");
    const res  = await fetch(`${JARVIS_BACKEND}/api/historial-jarvis/semana/${año}/${semana}`);
    const lista = await res.json();
    renderTablaJarvis(lista);
  } catch (err) {
    console.error("❌ Error cargando semana Jarvis:", err.message);
  }
}

// Renderizar tabla de señales
function renderTablaJarvis(lista) {
  const tbody = document.getElementById("jarvis-tabla-body");
  if (!tbody) return;

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="jarvis-tabla-vacia">Sin registros en este periodo</td></tr>`;
    return;
  }

  // Más reciente primero
  lista.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  tbody.innerHTML = lista.map((op) => {
    const ladoBadge = op.tipo === "BUY"
      ? `<span class="jarvis-badge jarvis-badge-buy">BUY</span>`
      : `<span class="jarvis-badge jarvis-badge-sell">SELL</span>`;

    const resBadge = op.resultado === "TP"
      ? `<span class="jarvis-res-badge jarvis-res-tp">TP ✓</span>`
      : op.resultado === "SL"
      ? `<span class="jarvis-res-badge jarvis-res-sl">SL ✗</span>`
      : op.resultado === "Timeout"
      ? `<span class="jarvis-res-badge jarvis-res-timeout">Timeout</span>`
      : `<span class="jarvis-res-badge jarvis-res-activa">Activa</span>`;

    const pnl     = op.pnl != null ? parseFloat(op.pnl) : null;
    const pnlText = pnl != null ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(3)}` : "—";
    const pnlClass = pnl == null ? "" : pnl >= 0 ? "jarvis-pnl-pos" : "jarvis-pnl-neg";

    const duracion = op.duracionMin != null ? `${op.duracionMin}m` : "—";
    const fecha    = new Date(op.timestamp).toLocaleString("es-MX", {
      day: "2-digit", month: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });

    return `
      <tr>
        <td class="jarvis-td-fecha">${fecha}</td>
        <td>${ladoBadge}</td>
        <td class="jarvis-td-mono">${op.entry ?? "—"}</td>
        <td class="jarvis-td-mono">${op.tp ?? "—"}</td>
        <td class="jarvis-td-mono">${op.sl ?? "—"}</td>
        <td>${resBadge}</td>
        <td class="jarvis-td-mono ${pnlClass}">${pnlText}</td>
        <td class="jarvis-td-duracion">${duracion}</td>
      </tr>
    `;
  }).join("");
}

// ============================================================
// 🚀 ARRANQUE DEL HISTORIAL
// ============================================================
let ultimoIDJarvis = null;

async function iniciarHistorialJarvis() {
  await cargarMetricasJarvis();
  await inicializarSelectorSemanas();

  // Evento selector semana
  const sel = document.getElementById("jarvis-selector-semana");
  if (sel) {
    sel.addEventListener("change", () => cargarSemanaJarvis(sel.value));
  }

  // Botón semana actual
  const btnActual = document.getElementById("jarvis-btn-semana-actual");
  if (btnActual) {
    btnActual.addEventListener("click", async () => {
      const actual   = obtenerSemanaActual();
      const opciones = Array.from(sel?.options || []).map((o) => o.value);
      if (opciones.includes(actual)) {
        sel.value = actual;
        await cargarSemanaJarvis(actual);
      }
    });
  }

  // Sincronizar ID inicial para polling
  try {
    const r = await fetch(`${JARVIS_BACKEND}/api/historial-jarvis/nueva`);
    const d = await r.json();
    ultimoIDJarvis = d.ultimaEntradaID || null;
  } catch {}
}

// ============================================================
// 🔥 POLLING — nueva señal detectada → refresca tabla y métricas
// ============================================================
async function verificarNuevaSenalJarvis() {
  try {
    const r = await fetch(`${JARVIS_BACKEND}/api/historial-jarvis/nueva`);
    const d = await r.json();
    if (!d.ultimaEntradaID || d.ultimaEntradaID === ultimoIDJarvis) return;

    ultimoIDJarvis = d.ultimaEntradaID;
    console.log("🔥 [Jarvis] Nueva señal detectada — refrescando historial");

    const sel = document.getElementById("jarvis-selector-semana");
    if (sel?.value) await cargarSemanaJarvis(sel.value);
    await cargarMetricasJarvis();

  } catch (err) {
    console.error("❌ Error polling Jarvis:", err.message);
  }
}

// ============================================================
// ⏱️ INICIO
// ============================================================
function iniciarMonitoreoJarvis() {
  verificarEstadoJarvis();
  setInterval(verificarEstadoJarvis, 8000);
  setInterval(verificarNuevaSenalJarvis, 10000);
}

document.addEventListener("DOMContentLoaded", () => {
  renderJarvisPanel();
});