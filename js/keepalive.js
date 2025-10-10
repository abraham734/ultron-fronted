// === keepalive.js ===
// Mantiene vivo el backend de Ultron en Render

const URL_BACKEND = "https://ultron-backend-zvtm.onrender.com"; // ✅ dominio correcto

function pingBackend() {
  fetch(URL_BACKEND)
    .then(response => {
      if (!response.ok) throw new Error(`Estado HTTP: ${response.status}`);
      console.log("✅ Backend ping exitoso:", response.status);
    })
    .catch(error => console.warn("⚠️ Error al hacer ping al backend:", error));
}

// Llama al backend cada 4 minutos (Render entra en sleep tras 15min inactivo)
setInterval(pingBackend, 1000 * 60 * 4);

// Primer ping inmediato
pingBackend();
