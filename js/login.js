/* login.js - Pantalla de inicio de sesión con manejo de sesiones. */
(function () {
  const form = document.getElementById("form-login");

  // Casilla para mostrar u ocultar la contraseña
  form.elements.mostrar.addEventListener("change", (ev) => {
    form.elements.contrasena.type = ev.target.checked ? "text" : "password";
  });

  conectarFormulario(form, {
    validar: validarLogin,
    alValido: (datos) => {
      const sesion = Api.iniciarSesion(datos.correo.trim(), datos.contrasena);
      actualizarSesionEnMenu();
      avisar("Sesión iniciada. Hola, " + sesion.nombre + ".", "success");
      setTimeout(() => { window.location.href = "pos.html"; }, 900);
    },
  });
})();
