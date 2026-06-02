// ============================================================
// 🔱 ULTRON – HISTORIAL FRONTEND (v5.0 PRO)
// Mejoras sobre v4.1:
//   - Fila de métricas: total, win rate, R:R promedio, P&L neto
//   - Columna Resultado con badge (TP1/TP2/TP3/SL/En curso)
//   - Columna R:R calculada automáticamente
//   - Filtro adicional por activo
//   - Polling mejorado (refresca métricas también)
// Fuente única de verdad: Backend /api/historial/*
// ============================================================

const API_URL = "https://ultron-backend-zvtm.onrender.com/api/historial";

const tablaBody          = document.getElementById("tabla-historial-body");
const selectorSemana     = document.getElementById("selector-semana");
const selectorMes        = document.getElementById("selector-mes");
const selectorActivo     = document.getElementById("selector-activo");
const selectorDesde      = document.getElementById("fecha-desde");
const selectorHasta      = document.getElementById("fecha-hasta");
const btnFiltrarRango    = document.getElementById("btn-filtrar-rango");
const btnSemanaActual    = document.getElementById("btn-semana-actual");

// ============================================================
// 🟢 Semana ISO actual
// ============================================================
function obtenerSemanaActual() {
  const hoy   = new Date();
  const año   = hoy.getUTCFullYear();
  const inicio = new Date(Date.UTC(año, 0, 1));
  const diff  = (hoy - inicio) / 86400000;
  const semana = Math.ceil((diff + inicio.getUTCDay() + 1) / 7);
  return `${año}-W${semana}`;
}

// ============================================================
// 🟣 Cargar historial completo
// ============================================================
async function cargarHistorialCompleto() {
  const res = await fetch(API_URL);
  return await res.json();
}

// ============================================================
// 📊 CALCULAR MÉTRICAS desde una lista de entradas
// ============================================================
function calcularMetricas(lista) {
  if (!lista || lista.length === 0) {
    return { total: 0, ganadoras: 0, perdedoras: 0, winRate: null, rrPromedio: null, pnlNeto: null };
  }

  const cerradas   = lista.filter(e => e.resultado && e.resultado !== "ACTIVA" && e.resultado !== "En curso");
  const ganadoras  = cerradas.filter(e =>
    e.resultado === "TP1" || e.resultado === "TP2" || e.resultado === "TP3" || e.resultado === "TP"
  );
  const perdedoras = cerradas.filter(e => e.resultado === "SL");

  const winRate = cerradas.length > 0
    ? Math.round((ganadoras.length / cerradas.length) * 100)
    : null;

  // R:R promedio — solo entradas con entry y stop válidos
  const rrVals = lista
    .filter(e => e.entry && e.stop && e.tp1)
    .map(e => {
      const riesgo   = Math.abs(e.entry - e.stop);
      const recompensa = Math.abs(e.tp1 - e.entry);
      return riesgo > 0 ? recompensa / riesgo : null;
    })
    .filter(v => v !== null);

  const rrPromedio = rrVals.length > 0
    ? (rrVals.reduce((a, b) => a + b, 0) / rrVals.length).toFixed(2)
    : null;

  // P&L neto en R — ganadoras suman, perdedoras restan
  // Si tiene resultado TP2 = +2R, TP3 = +3R, TP1/TP = +1R, SL = -1R
  const pnlNeto = cerradas.reduce((acc, e) => {
    if (e.resultado === "TP3") return acc + 3;
    if (e.resultado === "TP2") return acc + 2;
    if (e.resultado === "TP1" || e.resultado === "TP") return acc + 1;
    if (e.resultado === "SL")  return acc - 1;
    return acc;
  }, 0);

  return {
    total:     lista.length,
    ganadoras: ganadoras.length,
    perdedoras: perdedoras.length,
    winRate,
    rrPromedio,
    pnlNeto: cerradas.length > 0 ? pnlNeto : null,
  };
}

// ============================================================
// 📈 RENDERIZAR MÉTRICAS en la cabecera
// ============================================================
function renderMetricas(lista) {
  const m = calcularMetricas(lista);

  const setVal = (id, texto, clase = "") => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = texto;
    el.className   = `hist-metrica-valor ${clase}`;
  };

  setVal("hm-total",   m.total ?? "—");
  setVal("hm-winrate",
    m.winRate != null ? `${m.winRate}%` : "—",
    m.winRate == null ? "" : m.winRate >= 50 ? "hm-verde" : "hm-rojo"
  );
  setVal("hm-rr",
    m.rrPromedio != null ? `${m.rrPromedio}` : "—",
    m.rrPromedio != null ? "hm-amarillo" : ""
  );
  setVal("hm-pnl",
    m.pnlNeto != null ? `${m.pnlNeto >= 0 ? "+" : ""}${m.pnlNeto}R` : "—",
    m.pnlNeto == null ? "" : m.pnlNeto >= 0 ? "hm-verde" : "hm-rojo"
  );
}

// ============================================================
// 🔵 Inicializar selector de semanas
// ============================================================
async function inicializarSelectorSemanas() {
  const db = await cargarHistorialCompleto();
  selectorSemana.innerHTML = "";

  const semanas = Object.keys(db).sort().reverse();
  semanas.forEach(sem => {
    const opt = document.createElement("option");
    opt.value = sem;
    opt.textContent = sem;
    selectorSemana.appendChild(opt);
  });

  const actual = obtenerSemanaActual();
  if (semanas.includes(actual)) {
    selectorSemana.value = actual;
    await cargarSemana(actual);
  } else if (semanas.length > 0) {
    await cargarSemana(semanas[0]);
  }
}

// ============================================================
// 🔵 Inicializar selector de meses (YYYY-MM)
// ============================================================
async function inicializarSelectorMes() {
  const db    = await cargarHistorialCompleto();
  const meses = new Set();

  Object.values(db).forEach(semana => {
    semana.forEach(ent => {
      const fecha = new Date(ent.timestamp);
      const mes   = `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
      meses.add(mes);
    });
  });

  selectorMes.innerHTML = "";
  Array.from(meses).sort().reverse().forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    selectorMes.appendChild(opt);
  });
}

// ============================================================
// 🟤 Inicializar selector de activos (dinámico)
// ============================================================
async function inicializarSelectorActivo() {
  if (!selectorActivo) return;
  const db     = await cargarHistorialCompleto();
  const activos = new Set();

  Object.values(db).forEach(semana => {
    semana.forEach(ent => { if (ent.simbolo) activos.add(ent.simbolo); });
  });

  selectorActivo.innerHTML = `<option value="">Todos los activos</option>`;
  Array.from(activos).sort().forEach(a => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    selectorActivo.appendChild(opt);
  });
}

// ============================================================
// 🟦 Cargar semana específica
// ============================================================
async function cargarSemana(claveSemana) {
  const [año, semana] = claveSemana.split("-W");
  const res    = await fetch(`${API_URL}/semana/${año}/${semana}`);
  const datos  = await res.json();
  const filtrado = filtrarPorActivo(datos);
  renderTabla(filtrado);
  renderMetricas(filtrado);
}

// ============================================================
// 🟧 Cargar mes completo
// ============================================================
async function cargarMes(mes) {
  const db         = await cargarHistorialCompleto();
  const resultados = [];

  Object.values(db).forEach(sem => {
    sem.forEach(ent => {
      if (ent.timestamp.slice(0, 7) === mes) resultados.push(ent);
    });
  });

  const filtrado = filtrarPorActivo(resultados);
  renderTabla(filtrado);
  renderMetricas(filtrado);
}

// ============================================================
// 🟨 Cargar rango de fechas
// ============================================================
async function cargarRango(desde, hasta) {
  const res    = await fetch(`${API_URL}/rango?desde=${desde}&hasta=${hasta}`);
  const datos  = await res.json();
  const filtrado = filtrarPorActivo(datos);
  renderTabla(filtrado);
  renderMetricas(filtrado);
}

// ============================================================
// 🔍 Filtrar por activo seleccionado
// ============================================================
function filtrarPorActivo(lista) {
  if (!selectorActivo || !selectorActivo.value) return lista;
  return lista.filter(e => e.simbolo === selectorActivo.value);
}

// ============================================================
// 🟩 RENDERIZAR TABLA — v5.0 con columnas Resultado y R:R
// ============================================================
function renderTabla(lista) {
  tablaBody.innerHTML = "";

  if (!lista || lista.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="12" class="historial-vacio">
          No hay registros en este periodo
        </td>
      </tr>`;
    return;
  }

  lista.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  lista.forEach(ent => {
    const fila = document.createElement("tr");
    fila.classList.add("fila-historial");

    // Bias normalizado
    const biasRaw  = (ent.bias || "").toUpperCase();
    const biasFinal =
      biasRaw === "BUY"  ? "COMPRA" :
      biasRaw === "SELL" ? "VENTA"  :
      biasRaw || "—";
    const biasClass = biasFinal === "COMPRA" ? "hist-buy" : "hist-sell";

    // Resultado badge
    const res       = ent.resultado || "";
    const resBadge  = renderResultadoBadge(res);

    // R:R calculado
    const rrTexto = calcularRR(ent.entry, ent.stop, ent.tp1);

    fila.innerHTML = `
      <td class="hist-fecha">${new Date(ent.timestamp).toLocaleString("es-MX")}</td>
      <td class="hist-activo">${ent.simbolo ?? "—"}</td>
      <td class="hist-estrategia">${ent.tipoEntrada ?? "—"}</td>
      <td class="${biasClass}">${biasFinal}</td>
      <td class="hist-mono">${formatearPrecio(ent.entry)}</td>
      <td class="hist-mono">${formatearPrecio(ent.stop)}</td>
      <td class="hist-mono">${formatearPrecio(ent.tp1)}</td>
      <td class="hist-mono">${formatearPrecio(ent.tp2)}</td>
      <td class="hist-mono">${formatearPrecio(ent.tp3)}</td>
      <td>${resBadge}</td>
      <td class="hist-rr">${rrTexto}</td>
      <td class="hist-riesgo-${ent.riesgo === "alto" ? "alto" : ent.riesgo === "medio" ? "medio" : "bajo"}">
        ${ent.riesgo ?? "—"}
      </td>
    `;

    tablaBody.appendChild(fila);
  });
}

// ============================================================
// 🎨 Badge de resultado
// ============================================================
function renderResultadoBadge(resultado) {
  const mapa = {
    TP1:      { clase: "hist-res-tp",      texto: "TP1 ✓" },
    TP2:      { clase: "hist-res-tp2",     texto: "TP2 ✓" },
    TP3:      { clase: "hist-res-tp3",     texto: "TP3 ✓" },
    TP:       { clase: "hist-res-tp",      texto: "TP ✓"  },
    SL:       { clase: "hist-res-sl",      texto: "SL ✗"  },
    ACTIVA:   { clase: "hist-res-activa",  texto: "Activa" },
  };

  if (!resultado || resultado === "" || resultado === "En curso") {
    return `<span class="hist-res-badge hist-res-pendiente">En curso</span>`;
  }

  const cfg = mapa[resultado.toUpperCase()] || { clase: "hist-res-pendiente", texto: resultado };
  return `<span class="hist-res-badge ${cfg.clase}">${cfg.texto}</span>`;
}

// ============================================================
// 📐 Calcular R:R desde entry / stop / tp1
// ============================================================
function calcularRR(entry, stop, tp1) {
  const e = parseFloat(entry);
  const s = parseFloat(stop);
  const t = parseFloat(tp1);
  if (isNaN(e) || isNaN(s) || isNaN(t) || e === s) return "—";
  const riesgo     = Math.abs(e - s);
  const recompensa = Math.abs(t - e);
  return `1:${(recompensa / riesgo).toFixed(1)}`;
}

// Redondeo inteligente de precios segun magnitud
function formatearPrecio(valor) {
  const n = parseFloat(valor);
  if (isNaN(n) || valor == null) return "—";
  if (n >= 10000) return n.toFixed(0);   // BTC, indices grandes
  if (n >= 100)   return n.toFixed(2);   // Oro, acciones
  if (n >= 10)    return n.toFixed(4);   // USD/MXN
  return n.toFixed(5);                   // EUR/USD, GBP/USD
}

// ============================================================
// 🔧 EVENTOS
// ============================================================
selectorSemana.addEventListener("change", () => {
  cargarSemana(selectorSemana.value);
});

selectorMes.addEventListener("change", () => {
  cargarMes(selectorMes.value);
});

if (selectorActivo) {
  selectorActivo.addEventListener("change", () => {
    // Re-aplica el filtro sobre la vista activa (semana seleccionada)
    cargarSemana(selectorSemana.value);
  });
}

btnFiltrarRango.addEventListener("click", () => {
  if (!selectorDesde.value || !selectorHasta.value) {
    alert("Selecciona ambas fechas");
    return;
  }
  cargarRango(selectorDesde.value, selectorHasta.value);
});

btnSemanaActual.addEventListener("click", () => {
  const actual  = obtenerSemanaActual();
  const opciones = Array.from(selectorSemana.options).map(o => o.value);

  if (opciones.includes(actual)) {
    selectorSemana.value = actual;
    cargarSemana(actual);
  } else {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="12" class="historial-vacio">
          No hay registros en la semana actual
        </td>
      </tr>`;
    renderMetricas([]);
  }
});

// ============================================================
// 🚀 Inicialización
// ============================================================
let ultimoIDConocido = null;

async function iniciarHistorial() {
  await inicializarSelectorSemanas();
  await inicializarSelectorMes();
  await inicializarSelectorActivo();

  try {
    const res  = await fetch(`${API_URL}/nueva`);
    const data = await res.json();
    ultimoIDConocido = data.ultimaEntradaID || null;
  } catch {}
}

iniciarHistorial();

// ============================================================
// 🔥 POLLING — nueva entrada → refresca tabla y métricas
// ============================================================
async function verificarNuevaEntrada() {
  try {
    const res  = await fetch(`${API_URL}/nueva`);
    const data = await res.json();

    if (!data.ultimaEntradaID || data.ultimaEntradaID === ultimoIDConocido) return;

    ultimoIDConocido = data.ultimaEntradaID;
    console.log("🔥 Nueva señal detectada — refrescando historial");

    const semanaActual = obtenerSemanaActual();
    const opciones     = Array.from(selectorSemana.options).map(o => o.value);

    if (opciones.includes(semanaActual)) {
      selectorSemana.value = semanaActual;
      await cargarSemana(semanaActual);
    }
  } catch (err) {
    console.error("❌ Error verificando nueva entrada:", err);
  }
}

setInterval(verificarNuevaEntrada, 5000);