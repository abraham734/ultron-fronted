// === api_twelvedata.js ===
// Módulo mejorado con reintento automático y log detallado

const API_KEY = "3ffabcf2b71a46289f35c4c189fb0a16";
const BASE_URL = "https://api.twelvedata.com/time_series";

// Función principal que se exporta
export async function obtenerDatosOHLC(simbolo, intervalo = "15min") {
  try {
    const datos = await fetchDatosDesdeAPI(simbolo, intervalo);
    if (datos) return datos;

    // 🔁 Reintento único si fue null o vacío
    console.warn(`🔁 Reintentando ${simbolo} tras fallo inicial...`);
    await new Promise(r => setTimeout(r, 1000)); // esperar 1 segundo
    return await fetchDatosDesdeAPI(simbolo, intervalo);

  } catch (e) {
    console.error(`❌ Error crítico en ${simbolo}:`, e);
    return null;
  }
}

// Función auxiliar que hace el fetch
async function fetchDatosDesdeAPI(simbolo, intervalo) {
  const simboloFormateado = encodeURIComponent(simbolo);
  const url = `${BASE_URL}?symbol=${simboloFormateado}&interval=${intervalo}&apikey=${API_KEY}&language=en`;

  try {
    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    if (
      datos.status === "ok" &&
      datos.meta &&
      Array.isArray(datos.values) &&
      datos.values.length > 0
    ) {
      return {
        simbolo: datos.meta.symbol,
        intervalo: datos.meta.interval,
        ultimoCierre: parseFloat(datos.values[0].close),
        datos: datos.values
      };
    } else {
      console.warn(`⚠️ [${simbolo}] Datos incompletos o mal formateados:`, datos);
      return null;
    }
  } catch (error) {
    console.error(`❌ [${simbolo}] Fallo en fetchDatosDesdeAPI:`, error);
    return null;
  }
}

