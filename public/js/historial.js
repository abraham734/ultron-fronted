// === historial.js ===
// Sistema de notificaciones expandibles (acordeón) para Ultron
// Se conecta al motorDecisionUltron y guarda señales en localStorage

const contenedorHistorial = document.getElementById("historial-entradas");

// === Inicialización automática ===
export function cargarHistorialDesdeStorage() {
  const entradas = JSON.parse(localStorage.getItem("ultronHistorial")) || [];
  entradas.forEach((entrada) => renderEntrada(entrada));
  renderBotonBorrarTodo();
}

// === Registrar nueva señal ===
export function registrarEntradaUltron(entrada) {
  renderEntrada(entrada);

  const historial = JSON.parse(localStorage.getItem("ultronHistorial")) || [];
  historial.push(entrada);
  localStorage.setItem("ultronHistorial", JSON.stringify(historial));
}

// === Render visual de una entrada tipo acordeón ===
function renderEntrada({ activo, tipoEntrada, sl, tp1, tp2, tp3, fechaHora }) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "entrada-tarjeta";

  tarjeta.innerHTML = `
    <div class="entrada-cabecera">
      <div class="entrada-info">
        <strong>📈 ${activo}</strong>
        <span class="entrada-tipo">${tipoEntrada}</span>
        <span class="entrada-fecha">${fechaHora}</span>
      </div>
      <div class="entrada-acciones">
        <button class="btn-toggle">▼</button>
        <button class="btn-borrar" title="Eliminar entrada">❌</button>
      </div>
    </div>
    <div class="entrada-detalle oculto">
      <p>🛑 <b>SL:</b> ${sl}</p>
      <p>🎯 <b>TP1:</b> ${tp1}</p>
      <p>🎯 <b>TP2:</b> ${tp2}</p>
      <p>🎯 <b>TP3:</b> ${tp3}</p>
    </div>
  `;

  // === Botón desplegar/ocultar detalle ===
  const btnToggle = tarjeta.querySelector(".btn-toggle");
  const detalle = tarjeta.querySelector(".entrada-detalle");
 btnToggle.addEventListener("click", () => {
  const estaOculto = detalle.classList.contains("oculto");
  document.querySelectorAll(".entrada-detalle").forEach((d) => d.classList.add("oculto"));
  document.querySelectorAll(".btn-toggle").forEach((b) => b.classList.remove("abierto"));
  if (estaOculto) {
    detalle.classList.remove("oculto");
    btnToggle.classList.add("abierto"); // 🔄 cambia ▶ a ▼
  }
});


  // === Botón eliminar entrada ===
  const btnBorrar = tarjeta.querySelector(".btn-borrar");
  btnBorrar.addEventListener("click", () =>
    eliminarEntrada(activo, fechaHora, tarjeta)
  );

  contenedorHistorial.appendChild(tarjeta);
}

// === Eliminar una entrada ===
function eliminarEntrada(activo, fechaHora, tarjetaDOM) {
  const historial = JSON.parse(localStorage.getItem("ultronHistorial")) || [];
  const actualizado = historial.filter(
    (entrada) => entrada.activo !== activo || entrada.fechaHora !== fechaHora
  );
  localStorage.setItem("ultronHistorial", JSON.stringify(actualizado));
  tarjetaDOM.remove();
}

// === Borrar todo el historial ===
function renderBotonBorrarTodo() {
  const boton = document.createElement("button");
  boton.textContent = "🧹 Borrar Todo el Historial";
  boton.className = "btn-borrar-todo";

  boton.addEventListener("click", () => {
    if (confirm("¿Seguro que quieres borrar todo el historial?")) {
      localStorage.removeItem("ultronHistorial");
      contenedorHistorial.innerHTML = '<h3>📘 Historial de Entradas</h3>';
      renderBotonBorrarTodo();
    }
  });

  contenedorHistorial.appendChild(boton);
}
