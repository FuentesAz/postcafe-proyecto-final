const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'-]*$/;

function esVacio(valor) {
  return valor === undefined || valor === null || String(valor).trim() === "";
}

function armarResultado(errores) {
  const limpios = {};
  Object.keys(errores).forEach((campo) => {
    if (errores[campo]) limpios[campo] = errores[campo];
  });
  return { valido: Object.keys(limpios).length === 0, errores: limpios };
}

/* ---------- Reglas reutilizables (devuelven "" si todo está bien) ---------- */

function errorCorreo(valor) {
  if (esVacio(valor)) return "Escribe el correo electrónico.";
  if (!REGEX_CORREO.test(String(valor).trim())) {
    return "El correo no tiene un formato válido. Ejemplo: nombre@cafe.com.";
  }
  return "";
}

function errorTextoRequerido(valor, etiqueta, min, max) {
  const texto = String(valor === undefined || valor === null ? "" : valor).trim();
  if (texto === "") return "Escribe " + etiqueta + ".";
  if (texto.length < min) return "Debe tener al menos " + min + " caracteres.";
  if (texto.length > max) return "Debe tener máximo " + max + " caracteres.";
  return "";
}

function errorEntero(valor, etiqueta, max) {
  if (esVacio(valor)) return "Escribe " + etiqueta + ".";
  const t = String(valor).trim();
  if (isNaN(Number(t))) return "Debe ser un número.";
  if (!/^\d+$/.test(t)) return "Debe ser un número entero, sin decimales ni signo negativo.";
  if (Number(t) > max) return "No puede ser mayor que " + max + ".";
  return "";
}

function errorPrecio(valor) {
  if (esVacio(valor)) return "Escribe el precio.";
  const t = String(valor).trim();
  if (isNaN(Number(t))) return "El precio debe ser un número.";
  if (Number(t) <= 0) return "El precio debe ser mayor que 0.";
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return "El precio puede tener máximo 2 decimales. Ejemplo: 45.50.";
  if (Number(t) > 9999.99) return "El precio no puede ser mayor que 9999.99.";
  return "";
}

/* ---------- Validaciones por formulario ---------- */

function validarLogin(d) {
  const errores = {};
  errores.correo = errorCorreo(d.correo);
  if (esVacio(d.contrasena)) errores.contrasena = "Escribe tu contraseña.";
  else if (String(d.contrasena).length < 8) errores.contrasena = "La contraseña debe tener al menos 8 caracteres.";
  return armarResultado(errores);
}

function validarProducto(d) {
  const errores = {};
  errores.nombre = errorTextoRequerido(d.nombre, "el nombre del producto", 3, 50);
  if (!errores.nombre && (d.nombresExistentes || []).indexOf(String(d.nombre).trim().toLowerCase()) >= 0) {
    errores.nombre = "Ya existe un producto con ese nombre.";
  }
  if (!esVacio(d.descripcion) && String(d.descripcion).trim().length > 120) {
    errores.descripcion = "La descripción puede tener máximo 120 caracteres.";
  }
  errores.precio = errorPrecio(d.precio);
  errores.existencias = errorEntero(d.existencias, "las existencias", 9999);
  if (esVacio(d.categoriaId)) errores.categoriaId = "Selecciona una categoría.";
  return armarResultado(errores);
}

function validarUsuario(d) {
  const errores = {};
  errores.nombre = errorTextoRequerido(d.nombre, "el nombre completo", 3, 60);
  if (!errores.nombre && !REGEX_NOMBRE.test(String(d.nombre).trim())) {
    errores.nombre = "El nombre solo puede tener letras y espacios.";
  }
  errores.correo = errorCorreo(d.correo);
  if (!errores.correo && (d.correosExistentes || []).indexOf(String(d.correo).trim().toLowerCase()) >= 0) {
    errores.correo = "Ya existe un usuario con ese correo.";
  }
  if (esVacio(d.contrasena)) errores.contrasena = "Crea una contraseña.";
  else if (String(d.contrasena).length < 8) errores.contrasena = "La contraseña debe tener al menos 8 caracteres.";
  else if (!/[A-Za-z]/.test(d.contrasena) || !/\d/.test(d.contrasena)) {
    errores.contrasena = "Incluye al menos una letra y un número.";
  }
  if (esVacio(d.confirmacion)) errores.confirmacion = "Repite la contraseña.";
  else if (d.confirmacion !== d.contrasena) errores.confirmacion = "Las contraseñas no coinciden.";
  if (esVacio(d.rol)) errores.rol = "Selecciona un rol.";
  if (!d.confirmo) errores.confirmo = "Confirma que los datos son correctos para continuar.";
  return armarResultado(errores);
}

/* d.total y d.hayProductos los calcula la pantalla del punto de venta. */
function validarVenta(d) {
  const errores = {};
  if (!d.hayProductos) errores.carrito = "Agrega al menos un producto al ticket.";
  if (esVacio(d.metodo)) errores.metodo = "Elige un método de pago.";
  if (!esVacio(d.descuento)) {
    const t = String(d.descuento).trim();
    if (isNaN(Number(t))) errores.descuento = "El descuento debe ser un número.";
    else if (Number(t) < 0 || Number(t) > 100) errores.descuento = "El descuento debe estar entre 0 y 100.";
  }
  if (d.metodo === "Efectivo") {
    if (esVacio(d.recibido)) errores.recibido = "Escribe el monto recibido.";
    else if (isNaN(Number(d.recibido)) || Number(d.recibido) < 0) errores.recibido = "El monto recibido debe ser un número válido.";
    else if (Number(d.recibido) < Number(d.total)) {
      const falta = (Number(d.total) - Number(d.recibido)).toFixed(2);
      errores.recibido = "El monto recibido no cubre el total. Faltan $" + falta + ".";
    }
  }
  return armarResultado(errores);
}

function validarInventario(d) {
  const errores = {};
  if (esVacio(d.productoId)) errores.productoId = "Selecciona un producto.";
  errores.cantidad = errorEntero(d.cantidad, "la nueva cantidad", 9999);
  if (esVacio(d.motivo)) errores.motivo = "Selecciona el motivo del cambio.";
  return armarResultado(errores);
}

function validarFiltroFechas(d) {
  const errores = {};
  if (!esVacio(d.desde) && !esVacio(d.hasta) && d.hasta < d.desde) {
    errores.hasta = "La fecha final no puede ser anterior a la fecha inicial.";
  }
  return armarResultado(errores);
}

function validarEdicionCarrito(d) {
  const errores = {};
  errores.nombre = errorTextoRequerido(d.nombre, "el nombre del producto", 3, 50);
  errores.precioUnitario = errorPrecio(d.precioUnitario);
  const maxStock = Number(d.maxExistencias) || 9999;
  errores.cantidad = errorEntero(d.cantidad, "la cantidad", maxStock);
  if (!errores.cantidad && Number(d.cantidad) < 1) {
    errores.cantidad = "La cantidad debe ser al menos 1.";
  }
  if (!esVacio(d.nota) && String(d.nota).trim().length > 120) {
    errores.nota = "La nota puede tener máximo 120 caracteres.";
  }
  return armarResultado(errores);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    validarLogin, validarProducto, validarUsuario, validarVenta, validarInventario,
    validarFiltroFechas, validarEdicionCarrito, errorCorreo, errorPrecio, errorEntero,
  };
}
