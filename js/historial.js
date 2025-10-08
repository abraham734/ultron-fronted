// === historial.js ===
// Renderiza el historial de entradas detectadas por ULTRON

const contenedorHistorial = document.getElementById("historial-entradas");

// Cargar historial desde localStorage al iniciar
export function cargarHistorialDesdeStorage() {
  const entradas = JSON.parse(localStorage.getItem("ultronHistorial")) || [];
  entradas.forEach((entrada) => renderEntrada(entrada));
  renderBotonBorrarTodo();
}

// Agregar nueva entrada al historial y guardar en localStorage
export function registrarEntradaUltron(entrada) {
  renderEntrada(entrada);

  const historial = JSON.parse(localStorage.getItem("ultronHistorial")) || [];
  historial.push(entrada);
  localStorage.setItem("ultronHistorial", JSON.stringify(historial));
}

// Renderiza una entrada visualmente en el historial lateral
function renderEntrada({ activo, tipoEntrada, sl, tp1, tp2, tp3, fechaHora }) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "entrada-tarjeta";

  tarjeta.innerHTML = `
    <div class="entrada-cabecera">
      <strong>📈 ${activo}</strong>
      <button class="btn-borrar" title="Eliminar entrada">❌</button>
    </div>
    <div class="entrada-detalle">
      <p>🧠 <b>Tipo:</b> ${tipoEntrada}</p>
      <p>📆 <b>Fecha:</b> ${fechaHora}</p>
      <p>🛑 <b>SL:</b> ${sl}</p>
      <p>🎯 <b>TP1:</b> ${tp1}</p>
      <p>🎯 <b>TP2:</b> ${tp2}</p>
      <p>🎯 <b>TP3:</b> ${tp3}</p>
    </div>
  `;

  const btnBorrar = tarjeta.querySelector(".btn-borrar");
  btnBorrar.addEventListener("click", () => eliminarEntrada(activo, fechaHora, tarjeta));

  contenedorHistorial.appendChild(tarjeta);
}

// Elimina una entrada del DOM y de localStorage
function eliminarEntrada(activo, fechaHora, tarjetaDOM) {
  const historial = JSON.parse(localStorage.getItem("ultronHistorial")) || [];
  const actualizado = historial.filter(
    (entrada) => entrada.activo !== activo || entrada.fechaHora !== fechaHora
  );
  localStorage.setItem("ultronHistorial", JSON.stringify(actualizado));
  tarjetaDOM.remove();
}

// Botón para borrar TODO el historial
function renderBotonBorrarTodo() {
  const boton = document.createElement("button");
  boton.textContent = "🧹 Borrar Todo el Historial";
  boton.className = "btn-borrar-todo";

  boton.addEventListener("click", () => {
    if (confirm("¿Estás seguro de eliminar todo el historial?")) {
      localStorage.removeItem("ultronHistorial");
      contenedorHistorial.innerHTML = '<h3>📘 Historial de Entradas</h3>';
      renderBotonBorrarTodo();
    }
  });

  contenedorHistorial.appendChild(boton);
} 
