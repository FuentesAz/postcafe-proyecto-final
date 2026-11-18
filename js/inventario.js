/* inventario.js - Consulta y actualización de existencias. */
(function () {
  const categorias = Api.listarCategorias();
  let productos = Api.listarProductos();

  const form = document.getElementById("form-inventario");
  const tabla = document.getElementById("tabla-inventario");

  function nombreCategoria(id) {
    const c = categorias.find((x) => x.id === id);
    return c ? c.nombre : "Sin categoría";
  }

  function pintar() {
    tabla.innerHTML = productos.map((p) => {
      const estado = estadoExistencias(p.existencias);
      return "<tr><td>" + escaparHtml(p.nombre) + "</td><td>" + escaparHtml(nombreCategoria(p.categoriaId)) + "</td>" +
        '<td class="text-end">' + p.existencias + "</td>" +
        '<td><span class="badge text-bg-' + estado.clase + '">' + estado.texto + "</span></td></tr>";
    }).join("");
    form.elements.productoId.innerHTML =
      '<option value="">Selecciona un producto</option>' +
      productos.map((p) =>
        '<option value="' + p.id + '">' + escaparHtml(p.nombre) + " (hay " + p.existencias + ")</option>"
      ).join("");
  }

  const control = conectarFormulario(form, {
    validar: validarInventario,
    alValido: (datos) => {
      const actualizado = Api.actualizarExistencias(Number(datos.productoId), Number(datos.cantidad));
      productos = Api.listarProductos();
      control.reiniciar();
      pintar();
      avisar("Existencias de " + actualizado.nombre + " actualizadas a " + actualizado.existencias +
        " (motivo: " + datos.motivo.toLowerCase() + ").", "success");
    },
  });
  pintar();
})();
