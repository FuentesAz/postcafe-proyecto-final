/* ==========================================================
   logica.js - Funciones "puras" (no tocan la página).
   Se pueden probar con Node: node --test tests/
   ========================================================== */

function redondear(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatearMoneda(n) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

/* Subtotal, descuento (en pesos) y total de una venta. */
function calcularTotales(items, descuentoPorcentaje) {
  const subtotal = redondear(items.reduce((suma, i) => suma + i.precioUnitario * i.cantidad, 0));
  const pct = Number(descuentoPorcentaje) || 0;
  const descuento = redondear((subtotal * pct) / 100);
  const total = redondear(subtotal - descuento);
  return { subtotal, descuento, total };
}

/* ---------- Operaciones del carrito de compras ---------- */

function contarUnidadesCarrito(carrito) {
  return (carrito || []).reduce((total, item) => total + Number(item.cantidad || 0), 0);
}

function agregarItemCarrito(carrito, producto, cantidad, nota) {
  const lista = (carrito || []).map((i) => Object.assign({}, i));
  const cant = Math.max(1, Number(cantidad) || 1);
  const existente = lista.find((i) => i.productoId === producto.id);
  if (existente) {
    existente.cantidad += cant;
    if (nota !== undefined && String(nota).trim() !== "") {
      existente.nota = String(nota).trim();
    }
  } else {
    lista.push({
      productoId: producto.id,
      nombre: producto.nombre,
      precioUnitario: Number(producto.precio),
      cantidad: cant,
      nota: nota ? String(nota).trim() : "",
    });
  }
  return lista;
}

function modificarItemCarrito(carrito, productoId, cambios) {
  const id = Number(productoId);
  const resultado = [];
  (carrito || []).forEach((i) => {
    if (i.productoId !== id) {
      resultado.push(Object.assign({}, i));
      return;
    }
    const nuevaCantidad = cambios.cantidad !== undefined ? Number(cambios.cantidad) : i.cantidad;
    if (nuevaCantidad <= 0) return; // Si la cantidad llega a 0 o menos, se retira del carrito
    resultado.push({
      productoId: i.productoId,
      nombre: cambios.nombre !== undefined && String(cambios.nombre).trim() !== ""
        ? String(cambios.nombre).trim()
        : i.nombre,
      precioUnitario: cambios.precioUnitario !== undefined && Number(cambios.precioUnitario) > 0
        ? redondear(Number(cambios.precioUnitario))
        : i.precioUnitario,
      cantidad: nuevaCantidad,
      nota: cambios.nota !== undefined ? String(cambios.nota).trim() : (i.nota || ""),
    });
  });
  return resultado;
}

function eliminarItemCarrito(carrito, productoId) {
  const id = Number(productoId);
  return (carrito || []).filter((i) => i.productoId !== id).map((i) => Object.assign({}, i));
}

function calcularCambio(recibido, total) {
  return redondear(Number(recibido) - Number(total));
}

/* Estado visual de las existencias de un producto. */
function estadoExistencias(cantidad) {
  if (cantidad <= 0) return { texto: "Agotado", clase: "danger" };
  if (cantidad < 10) return { texto: "Stock bajo", clase: "warning" };
  return { texto: "Disponible", clase: "success" };
}

function fechaLocal(iso) {
  const d = new Date(iso);
  const dos = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + dos(d.getMonth() + 1) + "-" + dos(d.getDate());
}

/* desde y hasta llegan como "AAAA-MM-DD" (o vacíos). */
function filtrarVentasPorFecha(ventas, desde, hasta) {
  return ventas.filter((v) => {
    const dia = fechaLocal(v.fecha);
    if (desde && dia < desde) return false;
    if (hasta && dia > hasta) return false;
    return true;
  });
}

function resumenVentas(ventas) {
  const cantidad = ventas.length;
  const total = redondear(ventas.reduce((s, v) => s + v.total, 0));
  const conteo = {};
  ventas.forEach((v) =>
    v.detalle.forEach((d) => {
      conteo[d.nombre] = (conteo[d.nombre] || 0) + d.cantidad;
    })
  );
  let masVendido = null;
  Object.keys(conteo).forEach((nombre) => {
    if (!masVendido || conteo[nombre] > masVendido.cantidad) {
      masVendido = { nombre: nombre, cantidad: conteo[nombre] };
    }
  });
  return {
    cantidad: cantidad,
    total: total,
    ticketPromedio: cantidad ? redondear(total / cantidad) : 0,
    productoMasVendido: masVendido,
  };
}

function formatearFechaHora(iso) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    redondear, escaparHtml, formatearMoneda, calcularTotales, calcularCambio,
    estadoExistencias, fechaLocal, filtrarVentasPorFecha, resumenVentas, formatearFechaHora,
    contarUnidadesCarrito, agregarItemCarrito, modificarItemCarrito, eliminarItemCarrito,
  };
}
