// === api_twelvedata.js ===
// Módulo que conecta el frontend con el backend real alojado en Render

const BACKEND_URL = "https://ultron-backend-zvtm.onrender.com";

export async function obtenerDatosOHLC(simbolo) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/analisis?simbolo=${encodeURIComponent(simbolo)}`);
    if (!response.ok) throw new Error(`Error ${response.status}`);

    const data = await response.json();
    return data; // El backend devuelve el análisis completo
  } catch (error) {
    console.error("❌ Error al obtener datos desde backend:", error);
    return null;
  }
}
