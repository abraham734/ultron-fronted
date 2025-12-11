// ============================================================
// 🔱 ULTRON – HISTORIAL FRONTEND (v4.0 PRO TABULAR MODE)
// Tabla profesional con filtros por semana, mes y rango de fechas.
// Compatible con backend: /api/historial/*
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
// 🟢 Obtener semana actual (para autoselección)
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
// 🟣 Cargar historial completo (para construir listados)
// ============================================================
async function cargarHistorialCompleto() {
  const res = await fetch(API_URL);
  return await res.json();
}

// ============================================================
// 🔵 Rellenar selector de semanas dinámicamente
// ============================================================
async function inicializarSelectorSemanas() {
  const db = await cargarHistorialCompleto();
  selectorSemana.innerHTML = "";

  const semanas = Object.keys(db).sort().reverse(); // semanas recientes primero

  semanas.forEach(sem => {
    const opt = document.createElement("option");
    opt.value = sem;
    opt.textContent = sem;
    selectorSemana.appendChild(opt);
  });

  // seleccionar semana actual si existe
  const actual = obtenerSemanaActual();
  if (semanas.includes(actual)) {
    selectorSemana.value = actual;
    cargarSemana(actual);
  }
}

// ============================================================
// 🔵 Rellenar selector de meses (formato YYYY-MM)
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

  const lista = Array.from(meses).sort().reverse();

  selectorMes.innerHTML = "";
  lista.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    selectorMes.appendChild(opt);
  });
}

// ============================================================
// 🟦 Cargar datos de una semana específica
// ============================================================
async function cargarSemana(claveSemana) {
  const [año, semana] = claveSemana.split("-W");
  const res = await fetch(`${API_URL}/semana/${año}/${semana}`);
  const datos = await res.json();
  renderTabla(datos);
}

// ============================================================
// 🟧 Cargar datos de un mes
// ============================================================
async function cargarMes(mes) {
  const db = await cargarHistorialCompleto();
  const resultados = [];

  Object.values(db).forEach(sem => {
    sem.forEach(ent => {
      const fecha = ent.timestamp.slice(0, 7); // YYYY-MM
      if (fecha === mes) resultados.push(ent);
    });
  });

  renderTabla(resultados);
}

// ============================================================
// 🟨 Rango de fechas
// ============================================================
async function cargarRango(desde, hasta) {
  const url = `${API_URL}/rango?desde=${desde}&hasta=${hasta}`;
  const res = await fetch(url);
  const datos = await res.json();
  renderTabla(datos);
}

// ============================================================
// 🟩 Renderizar TABLA PROFESIONAL ULTRON
// ============================================================
function renderTabla(lista) {
  tablaBody.innerHTML = "";

  if (!lista || lista.length === 0) {
    tablaBody.innerHTML = `
      <tr><td colspan="10" class="historial-vacio">No hay registros en este periodo</td></tr>
    `;
    return;
  }

  lista.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  lista.forEach(ent => {
    const fila = document.createElement("tr");
    fila.classList.add("fila-historial");

    fila.innerHTML = `
      <td class="hist-fecha">${new Date(ent.timestamp).toLocaleString("es-MX")}</td>

      <td class="hist-activo">${ent.simbolo}</td>

      <td class="hist-estrategia">${ent.tipoEntrada}</td>

      <td class="${ent.bias === "COMPRA" ? "hist-buy" : "hist-sell"}">
        ${ent.bias}
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
  cargarRango(selectorDesde.value, selectorHasta.value);
});

btnSemanaActual.addEventListener("click", () => {
  const actual = obtenerSemanaActual();
  selectorSemana.value = actual;
  cargarSemana(actual);
});

// ============================================================
// 🚀 Inicialización
// ============================================================
async function iniciarHistorial() {
  await inicializarSelectorSemanas();
  await inicializarSelectorMes();
}

iniciarHistorial();
