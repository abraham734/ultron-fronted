// ============================================================
// 🔱 ULTRON – HISTORIAL FRONTEND (v4.1 PRO TABULAR MODE)
// Tabla profesional con filtros por semana, mes y rango de fechas.
// Fuente única de verdad: Backend /api/historial/*
// ============================================================

const API_URL = "https://ultron-backend-zvtm.onrender.com/api/historial";

const tablaBody = document.getElementById("tabla-historial-body");
const selectorSemana = document.getElementById("selector-semana");
const selectorMes = document.getElementById("selector-mes");
const selectorDesde = document.getElementById("fecha-desde");
const selectorHasta = document.getElementById("fecha-hasta");
const btnFiltrarRango = document.getElementById("btn-filtrar-rango");
const btnSemanaActual = document.getElementById("btn-semana-actual");

// ============================================================
// 🟢 Obtener semana ISO actual
// ============================================================
function obtenerSemanaActual() {
  const hoy = new Date();
  const año = hoy.getUTCFullYear();
  const inicio = new Date(Date.UTC(año, 0, 1));
  const diff = (hoy - inicio) / 86400000;
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
  }
}

// ============================================================
// 🔵 Inicializar selector de meses (YYYY-MM)
// ============================================================
async function inicializarSelectorMes() {
  const db = await cargarHistorialCompleto();
  const meses = new Set();

  Object.values(db).forEach(semana => {
    semana.forEach(ent => {
      const fecha = new Date(ent.timestamp);
      const mes = `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
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
// 🟦 Cargar semana específica
// ============================================================
async function cargarSemana(claveSemana) {
  const [año, semana] = claveSemana.split("-W");
  const res = await fetch(`${API_URL}/semana/${año}/${semana}`);
  const datos = await res.json();
  renderTabla(datos);
}

// ============================================================
// 🟧 Cargar mes completo
// ============================================================
async function cargarMes(mes) {
  const db = await cargarHistorialCompleto();
  const resultados = [];

  Object.values(db).forEach(sem => {
    sem.forEach(ent => {
      if (ent.timestamp.slice(0, 7) === mes) {
        resultados.push(ent);
      }
    });
  });

  renderTabla(resultados);
}

// ============================================================
// 🟨 Cargar rango de fechas
// ============================================================
async function cargarRango(desde, hasta) {
  const res = await fetch(`${API_URL}/rango?desde=${desde}&hasta=${hasta}`);
  const datos = await res.json();
  renderTabla(datos);
}

// ============================================================
// 🟩 Renderizar tabla ULTRON
// ============================================================
function renderTabla(lista) {
  tablaBody.innerHTML = "";

  if (!lista || lista.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="10" class="historial-vacio">
          No hay registros en este periodo
        </td>
      </tr>`;
    return;
  }

  lista.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  lista.forEach(ent => {
    const fila = document.createElement("tr");
    fila.classList.add("fila-historial");

    // 🔧 Normalizar bias para visualización
    const biasRaw = (ent.bias || "").toUpperCase();
    const biasFinal =
      biasRaw === "BUY" ? "COMPRA" :
      biasRaw === "SELL" ? "VENTA" :
      biasRaw || "-";

    fila.innerHTML = `
      <td class="hist-fecha">${new Date(ent.timestamp).toLocaleString("es-MX")}</td>
      <td class="hist-activo">${ent.simbolo}</td>
      <td class="hist-estrategia">${ent.tipoEntrada}</td>

      <td class="${biasFinal === "COMPRA" ? "hist-buy" : "hist-sell"}">
        ${biasFinal}
      </td>

      <td>${ent.entry ?? "-"}</td>
      <td>${ent.stop ?? "-"}</td>
      <td>${ent.tp1 ?? "-"}</td>
      <td>${ent.tp2 ?? "-"}</td>
      <td>${ent.tp3 ?? "-"}</td>

      <td class="hist-riesgo-${
        ent.riesgo === "alto" ? "alto" :
        ent.riesgo === "medio" ? "medio" :
        "bajo"
      }">
        ${ent.riesgo ?? "-"}
      </td>
    `;

    tablaBody.appendChild(fila);
  });
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

btnFiltrarRango.addEventListener("click", () => {
  if (!selectorDesde.value || !selectorHasta.value) {
    alert("Selecciona ambas fechas");
    return;
  }
  cargarRango(selectorDesde.value, selectorHasta.value);
});

btnSemanaActual.addEventListener("click", () => {
  const actual = obtenerSemanaActual();
  const opciones = Array.from(selectorSemana.options).map(o => o.value);

  if (opciones.includes(actual)) {
    selectorSemana.value = actual;
    cargarSemana(actual);
  } else {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="10" class="historial-vacio">
          No hay registros en la semana actual
        </td>
      </tr>`;
  }
});

// ============================================================
// 🚀 Inicialización
// ============================================================
let ultimoIDConocido = null;

async function iniciarHistorial() {
  await inicializarSelectorSemanas();
  await inicializarSelectorMes();

  // 🔥 Sincronizar polling con estado real del backend
  try {
    const res = await fetch(`${API_URL}/nueva`);
    const data = await res.json();
    ultimoIDConocido = data.ultimaEntradaID || null;
  } catch {}
}

iniciarHistorial();

// ============================================================
// 🔥 POLLING — detección automática de nuevas entradas
// ============================================================
async function verificarNuevaEntrada() {
  try {
    const res = await fetch(`${API_URL}/nueva`);
    const data = await res.json();

    if (!data.ultimaEntradaID) return;

    if (!ultimoIDConocido) {
      ultimoIDConocido = data.ultimaEntradaID;
      return;
    }

    if (data.ultimaEntradaID !== ultimoIDConocido) {
      ultimoIDConocido = data.ultimaEntradaID;

      console.log("🔥 Nueva señal detectada — refrescando historial");

      const semanaActual = obtenerSemanaActual();
      const opciones = Array.from(selectorSemana.options).map(o => o.value);

      if (opciones.includes(semanaActual)) {
        selectorSemana.value = semanaActual;
        await cargarSemana(semanaActual);
      }
    }
  } catch (err) {
    console.error("❌ Error verificando nueva entrada:", err);
  }
}

// Ejecutar cada 5 segundos
setInterval(verificarNuevaEntrada, 5000);
