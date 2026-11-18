/* ventas.js - Historial de ventas y reportes básicos. */
(function () {
  const form = document.getElementById("form-filtro");
  const tabla = document.getElementById("tabla-ventas");
  const vacio = document.getElementById("ventas-vacio");
  const usuarios = Api.listarUsuarios();

  function nombreUsuario(id) {
    const u = usuarios.find((x) => x.id === id);
    return u ? u.nombre : "Sin sesión";
  }

  function pintar(desde, hasta) {
    const ventas = filtrarVentasPorFecha(Api.listarVentas(), desde, hasta)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    tabla.innerHTML = ventas.map((v) =>
      "<tr><td>#" + v.id + "</td><td>" + escaparHtml(formatearFechaHora(v.fecha)) + "</td>" +
      "<td>" + escaparHtml(nombreUsuario(v.usuarioId)) + "</td><td>" + escaparHtml(v.metodoPago) + "</td>" +
      "<td>" + v.detalle.map((d) => d.cantidad + "× " + escaparHtml(d.nombre)).join(", ") + "</td>" +
      '<td class="text-end">' + formatearMoneda(v.total) + "</td></tr>"
    ).join("");
    vacio.classList.toggle("d-none", ventas.length > 0);

    const r = resumenVentas(ventas);
    document.getElementById("rep-cantidad").textContent = r.cantidad;
    document.getElementById("rep-total").textContent = formatearMoneda(r.total);
    document.getElementById("rep-promedio").textContent = formatearMoneda(r.ticketPromedio);
    document.getElementById("rep-top").textContent = r.productoMasVendido
      ? r.productoMasVendido.nombre + " (" + r.productoMasVendido.cantidad + ")"
      : "Sin ventas";
  }

  const control = conectarFormulario(form, {
    validar: validarFiltroFechas,
    alValido: (datos) => pintar(datos.desde, datos.hasta),
  });

  document.getElementById("btn-quitar-filtro").addEventListener("click", () => {
    control.reiniciar();
    pintar("", "");
  });

  pintar("", "");
})();
