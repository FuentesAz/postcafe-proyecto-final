/* ==========================================================
   app.js - Comportamiento común a todas las páginas:
   muestra el nombre del usuario desde el manejo de sesiones
   y conserva el indicador del carrito durante la navegación.
   ========================================================== */
function actualizarInsigniaCarrito() {
  const enlacePos = document.querySelector('.navbar-nav a[href="pos.html"]');
  if (!enlacePos || typeof Api === "undefined") return;
  const totalUnidades = contarUnidadesCarrito(Api.obtenerCarrito());
  let insignia = enlacePos.querySelector(".insignia-carrito");
  if (totalUnidades > 0) {
    if (!insignia) {
      insignia = document.createElement("span");
      insignia.className = "badge rounded-pill text-bg-warning ms-1 insignia-carrito";
      enlacePos.appendChild(insignia);
    }
    insignia.textContent = totalUnidades;
    insignia.setAttribute("title", totalUnidades + " producto(s) en el carrito");
  } else if (insignia) {
    insignia.remove();
  }
}

function actualizarSesionEnMenu() {
  const zona = document.getElementById("zona-sesion");
  if (!zona) return;
  const sesion = Api.obtenerSesion();
  if (sesion) {
    zona.innerHTML =
      '<span class="navbar-text text-white me-3" data-usuario-sesion>' +
      "Usuario: <strong>" + escaparHtml(sesion.nombre) + "</strong>" +
      (sesion.rol ? ' <small class="text-white-50">(' + escaparHtml(sesion.rol) + ")</small>" : "") +
      "</span>" +
      '<button type="button" class="btn btn-outline-light btn-sm" id="btn-salir">Cerrar sesión</button>';
    document.getElementById("btn-salir").addEventListener("click", () => {
      Api.cerrarSesion();
      actualizarSesionEnMenu();
      if (typeof window.alCambiarSesion === "function") window.alCambiarSesion();
      avisar("Cerraste la sesión.", "info");
    });
  } else {
    zona.innerHTML =
      '<span class="navbar-text text-white-50 me-3" data-usuario-sesion>Usuario: <strong>Invitado (sin sesión)</strong></span>' +
      '<a class="btn btn-outline-light btn-sm" href="login.html">Iniciar sesión</a>';
  }
  actualizarInsigniaCarrito();
}

actualizarSesionEnMenu();
Api.sincronizarConServidor(() => {
  actualizarSesionEnMenu();
  if (typeof window.alCambiarSesion === "function") window.alCambiarSesion();
});
