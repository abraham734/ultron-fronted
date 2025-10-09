// === estadoSistema.js ===
// Control visual del estado de Ultron (EN VIVO, ERROR API, MERCADO CERRADO)

const URL_BACKEND = "https://ultron-backend-nestor6601.onrender.com"; // Dominio real

// === Función principal de verificación ===
export async function verificarEstadoSistema() {
  try {
    const respuesta = await fetch(URL_BACKEND + "/", { mode: "cors" });

    if (respuesta.ok) {
      actualizarIndicadorEstado("verde", "ULTRÓN OPERATIVO 🟢");
      console.log("✅ Backend en línea");
    } else {
      actualizarIndicadorEstado("rojo", "Backend NO responde ❌");
      console.warn("⚠️ Backend no respondió correctamente");
    }
  } catch (error) {
    actualizarIndicadorEstado("rojo", "Error de conexión al backend ⚠️");
    console.error("❌ Error de conexión o CORS:", error);
  }
}

// === Indicador visual del estado ===
export function actualizarIndicadorEstado(color = "verde", texto = "ULTRÓN OPERATIVO") {
  // Asegurar que el DOM esté cargado antes de intentar modificarlo
  if (document.readyState !== "complete") {
    window.addEventListener("load", () => actualizarIndicadorEstado(color, texto));
    return;
  }

  const indicador = document.getElementById("indicador-vivo");
  if (!indicador) return;

  const colores = {
    verde: "#00c896",
    gris: "#999",
    rojo: "#ff3b3b",
  };

  indicador.innerHTML = `
    <span id="punto-status"
          style="display:inline-block;
                 width:10px; height:10px;
                 border-radius:50%;
                 background-color:${colores[color]};
                 box-shadow:0 0 6px ${colores[color]};
                 margin-right:6px;">
    </span>${texto}
  `;
}
