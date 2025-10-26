// === matrixrain.js ===
// Efecto "Matrix Rain" versión Ultron — tonos cian/azul neón
// Diseñado para fondo oscuro con estética tecnológica

export function iniciarMatrixRain() {
  // 🧩 Evita duplicados: si ya existe un canvas, no crear otro
  const existingCanvas = document.getElementById("matrix-rain");
  if (existingCanvas) {
    console.warn("⚠️ MatrixRain ya está activo, se omite nueva creación.");
    return { canvas: existingCanvas };
  }

  // Crear e insertar el canvas
  const canvas = document.createElement("canvas");
  canvas.id = "matrix-rain";
  document.body.insertBefore(canvas, document.body.firstChild);

  // === Estilo visual ===
  Object.assign(canvas.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "-1",
    pointerEvents: "none",
    opacity: "0.35",
    background: "transparent",
  });

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Caracteres — mezcla técnica con letras latinas
  const simbolos = "01ΛΣΞΦΩΨΔΓΠΘΩΧΒΝΜ<>-=+*#@$&";
  const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const alfabeto = simbolos + latin;

  // Tamaño de fuente y columnas
  const fontSize = 16;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array(columns).fill(1);

  // === Efecto principal ===
  function draw() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#00FFFF");
    gradient.addColorStop(1, "#0077FF");
    ctx.fillStyle = gradient;
    ctx.font = `${fontSize}px 'Courier New', monospace`;

    drops.forEach((y, index) => {
      const text = alfabeto.charAt(Math.floor(Math.random() * alfabeto.length));
      const x = index * fontSize;
      ctx.fillText(text, x, y * fontSize);

      if (y * fontSize > canvas.height && Math.random() > 0.975) {
        drops[index] = 0;
      }

      drops[index] += 0.45; // velocidad controlada
    });
  }

  const interval = setInterval(draw, 80);

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  console.log("🟢 Matrix Rain Ultron (azul cian) activo.");
  return { canvas, interval };
}

// === Detener efecto ===
export function detenerMatrixRain(matrix) {
  if (matrix && matrix.interval) clearInterval(matrix.interval);
  if (matrix && matrix.canvas) matrix.canvas.remove();
  console.log("🔴 Matrix Rain Ultron detenido.");
}
