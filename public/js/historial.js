// === historial.js — Ultron TradingView Style ===
// Reemplaza tarjetas por tabla con filas dinámicas
// Mantiene localStorage y permite ✔ / ✖ / 🗑️ manual

const tablaBody = document.querySelector("#tabla-historial tbody");

// Validación preventiva
if (!tablaBody) {
  console.error("❌ No se encontró el cuerpo de la tabla historial.");
}

// === Cargar historial al iniciar ===
export function cargarHistorialDesdeStorage() {
  const entradas = JSON.parse(localStorage.getItem("ultronHistorial")) || [];
  entradas.forEach((entrada) => renderFila(entrada));
}

// === Registrar nueva entrada ===
export function registrarEntradaUltron(entrada) {
  renderFila(entrada);

  const historial = JSON.parse(localStorage.getItem("ultronHistorial")) || [];
  historial.push(entrada);
  localStorage.setItem("ultronHistorial", JSON.stringify(historial));
}

// === Renderizar fila TABLA ===
function renderFila({ fechaHora, activo, tipoEntrada, sentido, entry, sl, tp1, tp2, tp3 }) {
  const fila = document.createElement("tr");
  const dirClass = sentido?.toLowerCase() === "buy" ? "buy" : "sell";

  function asignarColorActivo(activo) {
  if (activo.includes("USD") || activo.includes("EUR")) return "badge-forex";
  if (activo.includes("XAU")) return "badge-xau";
  if (["BTC", "ETH", "SOL", "BNB"].some(c => activo.includes(c))) return "badge-crypto";
  return "badge-stock"; // acciones por defecto
}


  fila.innerHTML = `
    <td>${fechaHora}</td>
   <td class="${asignarColorActivo(activo)}">${activo}</td>
    <td>${tipoEntrada}</td>
    <td class="${dirClass}">${sentido}</td>
    <td>${entry}</td>
    <td>${sl}</td>
    <td>${Number(tp1).toFixed(4)}</td>
    <td>${Number(tp2).toFixed(4)}</td>
    <td>${Number(tp3).toFixed(4)}</td>

    <td><button class="btn-ok">✔</button></td>
    <td><button class="btn-bad">✖</button></td>
    <td><button class="btn-delete">🗑️</button></td>
  `;

  // === Botón ✔ ===
  fila.querySelector(".btn-ok").addEventListener("click", () => {
    fila.classList.add("resultado-ok");
    fila.classList.remove("resultado-bad");
  });

  // === Botón ✖ ===
  fila.querySelector(".btn-bad").addEventListener("click", () => {
    fila.classList.add("resultado-bad");
    fila.classList.remove("resultado-ok");
  });

  // === Botón borrar individual ===
  fila.querySelector(".btn-delete").addEventListener("click", () => {
    fila.remove();
    borrarEntradaDeStorage(fechaHora);
  });

  tablaBody.appendChild(fila);
}

// === Borrar una entrada del storage ===
function borrarEntradaDeStorage(fecha) {
  let historial = JSON.parse(localStorage.getItem("ultronHistorial")) || [];
  historial = historial.filter(entry => entry.fechaHora !== fecha);
  localStorage.setItem("ultronHistorial", JSON.stringify(historial));
}

// === Borrar TODO el historial ===
const btnBorrarTodo = document.getElementById("btn-borrar-todo");
if (btnBorrarTodo) {
  btnBorrarTodo.addEventListener("click", () => {
    tablaBody.innerHTML = "";
    localStorage.removeItem("ultronHistorial");
  });
}
