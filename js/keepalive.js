// === keepalive.js ===
// Realiza un llamado periódico al backend para mantenerlo activo en Render

const URL_BACKEND = "https://ultron-backend-nestor6601.onrender.com"; // ← reemplaza con tu dominio real de Render

function pingBackend() {
  fetch(URL_BACKEND)
    .then(response => console.log("✅ Backend ping exitoso:", response.status))
    .catch(error => console.warn("⚠️ Error al hacer ping al backend:", error));
}

// Llama al backend cada 4 minutos (Render entra en sleep tras 15min inactivo)
setInterval(pingBackend, 1000 * 60 * 4);

// Primer ping inmediato
pingBackend();
