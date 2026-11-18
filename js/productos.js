/* productos.js - Gestión de productos: registrar, consultar, modificar y eliminar. */
(function () {
  const categorias = Api.listarCategorias();
  let productos = Api.listarProductos();

  const form = document.getElementById("form-producto");
  const tabla = document.getElementById("tabla-productos");
  const titulo = document.getElementById("titulo-form");
  const btnCancelar = document.getElementById("btn-cancelar");

  form.elements.categoriaId.innerHTML =
    '<option value="">Selecciona una categoría</option>' +
    categorias.map((c) => '<option value="' + c.id + '">' + escaparHtml(c.nombre) + "</option>").join("");

  function nombreCategoria(id) {
    const c = categorias.find((x) => x.id === id);
    return c ? c.nombre : "Sin categoría";
  }

  function pintarTabla() {
    tabla.innerHTML = productos.map((p) =>
      "<tr>" +
      "<td>" + escaparHtml(p.nombre) + "</td>" +
      "<td>" + escaparHtml(nombreCategoria(p.categoriaId)) + "</td>" +
      '<td class="text-end">' + formatearMoneda(p.precio) + "</td>" +
      '<td class="text-end">' + p.existencias + "</td>" +
      '<td class="text-end text-nowrap">' +
      '<button type="button" class="btn btn-sm btn-outline-primary me-1" data-accion="editar" data-id="' + p.id + '">Editar</button>' +
      '<button type="button" class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="' + p.id + '">Eliminar</button>' +
      "</td></tr>"
    ).join("");
  }

  function leerProducto(f) {
    const datos = leerFormulario(f);
    const idActual = datos.id ? Number(datos.id) : null;
    datos.nombresExistentes = productos
      .filter((p) => p.id !== idActual)
      .map((p) => p.nombre.toLowerCase());
    return datos;
  }

  function salirDeEdicion() {
    control.reiniciar();
    form.elements.id.value = "";
    titulo.textContent = "Registrar producto";
    btnCancelar.classList.add("d-none");
  }

  function guardar(datos) {
    const editando = !!datos.id;
    Api.guardarProducto({
      id: editando ? Number(datos.id) : undefined,
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      precio: Number(datos.precio),
      existencias: Number(datos.existencias),
      categoriaId: Number(datos.categoriaId),
    });
    productos = Api.listarProductos();
    pintarTabla();
    salirDeEdicion();
    avisar(editando ? "Cambios guardados." : "Producto registrado.", "success");
  }

  tabla.addEventListener("click", (ev) => {
    const boton = ev.target.closest("[data-accion]");
    if (!boton) return;
    const id = Number(boton.getAttribute("data-id"));
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;
    if (boton.getAttribute("data-accion") === "editar") {
      form.elements.id.value = producto.id;
      form.elements.nombre.value = producto.nombre;
      form.elements.descripcion.value = producto.descripcion;
      form.elements.precio.value = producto.precio;
      form.elements.existencias.value = producto.existencias;
      form.elements.categoriaId.value = String(producto.categoriaId);
      titulo.textContent = "Editar producto";
      btnCancelar.classList.remove("d-none");
      form.elements.nombre.focus();
    } else if (window.confirm("¿Eliminar \"" + producto.nombre + "\"? Esta acción no se puede deshacer.")) {
      Api.eliminarProducto(id);
      productos = Api.listarProductos();
      pintarTabla();
      avisar("Producto eliminado.", "info");
    }
  });

  btnCancelar.addEventListener("click", salirDeEdicion);

  const control = conectarFormulario(form, { validar: validarProducto, alValido: guardar, leer: leerProducto });
  pintarTabla();
})();
