/* ==========================================================
   fecha.js - Muestra la fecha y la hora actuales en la página.
   ========================================================== */
function formatearFechaLarga(fecha) {
  const texto = fecha.toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearHora(fecha) {
  return fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function saludoSegunHora(fecha) {
  const h = fecha.getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function actualizarFechaEnPagina() {
  const ahora = new Date();
  document.querySelectorAll("[data-fecha]").forEach((el) => {
    el.textContent = formatearFechaLarga(ahora);
  });
  document.querySelectorAll("[data-hora]").forEach((el) => {
    el.textContent = formatearHora(ahora);
  });
  document.querySelectorAll("[data-saludo]").forEach((el) => {
    el.textContent = saludoSegunHora(ahora);
  });
}

if (typeof document !== "undefined") {
  actualizarFechaEnPagina();
  setInterval(actualizarFechaEnPagina, 30000); // se actualiza cada 30 segundos
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { formatearFechaLarga, formatearHora, saludoSegunHora };
}
