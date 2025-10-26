// === matrixrain.js ===
// Efecto visual tipo Matrix Rain (código cayendo)
// Activable/desactivable sin afectar el resto del sistema

export function iniciarMatrixRain() {
  const canvas = document.createElement("canvas");
  canvas.id = "matrix-rain";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const katakana = "アイウエオカキクケコサシスセソタチツテトナニヌネノ";
  const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  const alphabet = katakana + latin + nums;

  const fontSize = 16;
  const columns = canvas.width / fontSize;
  const drops = Array(Math.floor(columns)).fill(1);

  function draw() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00FF41"; // verde neón clásico
    ctx.font = `${fontSize}px monospace`;

    drops.forEach((y, index) => {
      const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      const x = index * fontSize;
      ctx.fillText(text, x, y * fontSize);

      if (y * fontSize > canvas.height && Math.random() > 0.975) {
        drops[index] = 0;
      }
      drops[index] += 0.5; // en lugar de 1

    });
  }

  const interval = setInterval(draw, 80);


  // Ajusta al cambiar tamaño de ventana
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  console.log("🟢 Matrix Rain iniciado.");
  return { canvas, interval };
}

export function detenerMatrixRain(matrix) {
  if (matrix && matrix.interval) clearInterval(matrix.interval);
  if (matrix && matrix.canvas) matrix.canvas.remove();
  console.log("🔴 Matrix Rain detenido.");
}
