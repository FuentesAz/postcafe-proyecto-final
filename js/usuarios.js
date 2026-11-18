/* usuarios.js - Gestión de usuarios y roles. */
(function () {
  let usuarios = Api.listarUsuarios();

  const form = document.getElementById("form-usuario");
  const tabla = document.getElementById("tabla-usuarios");

  form.elements.rol.innerHTML =
    '<option value="">Selecciona un rol</option>' +
    ROLES.map((r) => '<option value="' + r + '">' + r + "</option>").join("");

  function pintar() {
    tabla.innerHTML = usuarios.map((u) =>
      "<tr><td>" + escaparHtml(u.nombre) + "</td><td>" + escaparHtml(u.correo) + "</td><td>" + escaparHtml(u.rol) + "</td></tr>"
    ).join("");
  }

  function leerUsuario(f) {
    const datos = leerFormulario(f);
    datos.correosExistentes = usuarios.map((u) => u.correo.toLowerCase());
    return datos;
  }

  const control = conectarFormulario(form, {
    validar: validarUsuario,
    leer: leerUsuario,
    alValido: (datos) => {
      // La contraseña no se guarda aquí: la procesará el BackEnd (cifrada).
      Api.crearUsuario({ nombre: datos.nombre.trim(), correo: datos.correo.trim(), rol: datos.rol });
      usuarios = Api.listarUsuarios();
      control.reiniciar();
      pintar();
      avisar("Usuario registrado.", "success");
    },
  });
  pintar();
})();
