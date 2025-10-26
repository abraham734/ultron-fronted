// === matrixrain_ultron.js ===
// Efecto "Matrix Rain" versión Ultron — tonos cian/azul neón
// Diseñado para fondo oscuro con estética tecnológica

export function iniciarMatrixRain() {
  const canvas = document.createElement("canvas");
  canvas.id = "matrix-rain";
  document.body.prepend(canvas); // 👈 se inserta al inicio, debajo de todo
canvas.style.zIndex = "-1"; // 👈 asegura que esté al fondo


  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Caracteres (mezcla entre símbolos técnicos y letras)
  const simbolos = "01ΛΣΞΦΩΨΔΓΠΘΩΧΒΝΜ<>-=+*#@$&";
  const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const alfabeto = simbolos + latin;

  // Tamaño y columnas
  const fontSize = 16;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array(columns).fill(1);

  // === Efecto principal ===
  function draw() {
    // Fondo translúcido (deja una estela)
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Color principal: azul-cian neón con leve degradado
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#00FFFF"); // cian brillante
    gradient.addColorStop(1, "#0077FF"); // azul profundo
    ctx.fillStyle = gradient;
    ctx.font = `${fontSize}px 'Courier New', monospace`;

    // Dibujar cada línea
    drops.forEach((y, index) => {
      const text = alfabeto.charAt(Math.floor(Math.random() * alfabeto.length));
      const x = index * fontSize;
      ctx.fillText(text, x, y * fontSize);

      // Reinicio aleatorio de las "gotas"
      if (y * fontSize > canvas.height && Math.random() > 0.975) {
        drops[index] = 0;
      }

      // 🔽 Caída más lenta y fluida
      drops[index] += 0.45;
    });
  }

  // Intervalo pausado (≈12 fps)
  const interval = setInterval(draw, 80);

  // Recalcular en caso de cambio de ventana
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
