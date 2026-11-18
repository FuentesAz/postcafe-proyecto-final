/* index.js - Resumen del día en la página principal. */
(function () {
  const hoy = fechaLocal(new Date().toISOString());
  const ventasHoy = filtrarVentasPorFecha(Api.listarVentas(), hoy, hoy);
  const resumen = resumenVentas(ventasHoy);
  const stockBajo = Api.listarProductos().filter((p) => p.existencias < 10).length;

  document.getElementById("res-ventas").textContent = resumen.cantidad;
  document.getElementById("res-total").textContent = formatearMoneda(resumen.total);
  document.getElementById("res-stock").textContent = stockBajo;
})();
