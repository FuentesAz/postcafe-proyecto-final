const test = require("node:test");
const assert = require("node:assert/strict");

const L = require("../js/logica.js");
const V = require("../js/validaciones.js");
const { crearCalculadora } = require("../js/calculadora.js");
const F = require("../js/fecha.js");

/* ---------- Totales y reportes ---------- */
test("calcularTotales: subtotal, descuento y total", () => {
  const items = [
    { precioUnitario: 55, cantidad: 2 },
    { precioUnitario: 28, cantidad: 1 },
  ];
  assert.deepEqual(L.calcularTotales(items, 0), { subtotal: 138, descuento: 0, total: 138 });
  assert.deepEqual(L.calcularTotales(items, 10), { subtotal: 138, descuento: 13.8, total: 124.2 });
});

test("calcularTotales: carrito vacío", () => {
  assert.deepEqual(L.calcularTotales([], 20), { subtotal: 0, descuento: 0, total: 0 });
});

test("calcularCambio", () => {
  assert.equal(L.calcularCambio(200, 124.2), 75.8);
});

test("estadoExistencias", () => {
  assert.equal(L.estadoExistencias(0).clase, "danger");
  assert.equal(L.estadoExistencias(9).clase, "warning");
  assert.equal(L.estadoExistencias(10).clase, "success");
});

test("resumenVentas y producto más vendido", () => {
  const ventas = [
    { total: 100, detalle: [{ nombre: "Latte", cantidad: 2 }, { nombre: "Galleta", cantidad: 1 }] },
    { total: 50, detalle: [{ nombre: "Latte", cantidad: 1 }] },
  ];
  const r = L.resumenVentas(ventas);
  assert.equal(r.cantidad, 2);
  assert.equal(r.total, 150);
  assert.equal(r.ticketPromedio, 75);
  assert.deepEqual(r.productoMasVendido, { nombre: "Latte", cantidad: 3 });
  assert.deepEqual(L.resumenVentas([]), { cantidad: 0, total: 0, ticketPromedio: 0, productoMasVendido: null });
});

test("filtrarVentasPorFecha", () => {
  const dia = (d) => new Date(2026, 9, d, 12, 0).toISOString();
  const ventas = [{ id: 1, fecha: dia(10) }, { id: 2, fecha: dia(15) }, { id: 3, fecha: dia(20) }];
  assert.deepEqual(L.filtrarVentasPorFecha(ventas, "2026-10-12", "2026-10-18").map((v) => v.id), [2]);
  assert.deepEqual(L.filtrarVentasPorFecha(ventas, "", "2026-10-15").map((v) => v.id), [1, 2]);
  assert.equal(L.filtrarVentasPorFecha(ventas, "", "").length, 3);
});

test("escaparHtml evita código inyectado", () => {
  assert.equal(L.escaparHtml('<img src=x onerror="a()">'), "&lt;img src=x onerror=&quot;a()&quot;&gt;");
});

/* ---------- Validaciones ---------- */
test("validarLogin", () => {
  assert.equal(V.validarLogin({ correo: "", contrasena: "" }).valido, false);
  assert.ok(V.validarLogin({ correo: "a@b", contrasena: "12345678" }).errores.correo);
  assert.ok(V.validarLogin({ correo: "a@b.com", contrasena: "1234" }).errores.contrasena);
  assert.equal(V.validarLogin({ correo: "ana@cafe.com", contrasena: "abcd1234" }).valido, true);
});

test("validarProducto", () => {
  const bueno = { nombre: "Mocha", descripcion: "", precio: "55.50", existencias: "10", categoriaId: "1", nombresExistentes: [] };
  assert.equal(V.validarProducto(bueno).valido, true);
  assert.ok(V.validarProducto({ ...bueno, nombre: "ab" }).errores.nombre);
  assert.ok(V.validarProducto({ ...bueno, nombre: "Latte", nombresExistentes: ["latte"] }).errores.nombre);
  assert.ok(V.validarProducto({ ...bueno, precio: "0" }).errores.precio);
  assert.ok(V.validarProducto({ ...bueno, precio: "-3" }).errores.precio);
  assert.ok(V.validarProducto({ ...bueno, precio: "5.123" }).errores.precio);
  assert.ok(V.validarProducto({ ...bueno, existencias: "2.5" }).errores.existencias);
  assert.ok(V.validarProducto({ ...bueno, existencias: "" }).errores.existencias);
  assert.ok(V.validarProducto({ ...bueno, categoriaId: "" }).errores.categoriaId);
  assert.ok(V.validarProducto({ ...bueno, descripcion: "x".repeat(121) }).errores.descripcion);
});

test("validarUsuario", () => {
  const bueno = { nombre: "Luis Pérez", correo: "luis@cafe.com", contrasena: "clave1234", confirmacion: "clave1234", rol: "Cajero", confirmo: true, correosExistentes: [] };
  assert.equal(V.validarUsuario(bueno).valido, true);
  assert.ok(V.validarUsuario({ ...bueno, nombre: "Luis123" }).errores.nombre);
  assert.ok(V.validarUsuario({ ...bueno, contrasena: "sololetras", confirmacion: "sololetras" }).errores.contrasena);
  assert.ok(V.validarUsuario({ ...bueno, confirmacion: "otra1234" }).errores.confirmacion);
  assert.ok(V.validarUsuario({ ...bueno, rol: "" }).errores.rol);
  assert.ok(V.validarUsuario({ ...bueno, confirmo: false }).errores.confirmo);
  assert.ok(V.validarUsuario({ ...bueno, correosExistentes: ["luis@cafe.com"] }).errores.correo);
});

test("validarVenta", () => {
  const base = { hayProductos: true, metodo: "Tarjeta", descuento: "", recibido: "", total: 100 };
  assert.equal(V.validarVenta(base).valido, true);
  assert.ok(V.validarVenta({ ...base, hayProductos: false }).errores.carrito);
  assert.ok(V.validarVenta({ ...base, metodo: "" }).errores.metodo);
  assert.ok(V.validarVenta({ ...base, descuento: "150" }).errores.descuento);
  assert.ok(V.validarVenta({ ...base, descuento: "-5" }).errores.descuento);
  assert.ok(V.validarVenta({ ...base, metodo: "Efectivo", recibido: "" }).errores.recibido);
  assert.ok(V.validarVenta({ ...base, metodo: "Efectivo", recibido: "80" }).errores.recibido);
  assert.equal(V.validarVenta({ ...base, metodo: "Efectivo", recibido: "100" }).valido, true);
});

test("validarInventario y validarFiltroFechas", () => {
  assert.equal(V.validarInventario({ productoId: "1", cantidad: "0", motivo: "Merma" }).valido, true);
  assert.ok(V.validarInventario({ productoId: "", cantidad: "5", motivo: "Merma" }).errores.productoId);
  assert.ok(V.validarInventario({ productoId: "1", cantidad: "-1", motivo: "Merma" }).errores.cantidad);
  assert.ok(V.validarInventario({ productoId: "1", cantidad: "5", motivo: "" }).errores.motivo);
  assert.ok(V.validarFiltroFechas({ desde: "2026-10-20", hasta: "2026-10-01" }).errores.hasta);
  assert.equal(V.validarFiltroFechas({ desde: "", hasta: "2026-10-01" }).valido, true);
});

/* ---------- Calculadora ---------- */
function teclear(calc, secuencia) {
  secuencia.split(" ").forEach((t) => {
    if (/^\d$/.test(t)) calc.digito(t);
    else if (t === ".") calc.punto();
    else if (t === "=") calc.igual();
    else if (t === "C") calc.limpiar();
    else if (t === "<") calc.borrar();
    else if (t === "±") calc.cambiarSigno();
    else if (t === "%") calc.porcentaje();
    else calc.operador(t);
  });
  return calc.estado().pantalla;
}

test("calculadora: operaciones básicas", () => {
  assert.equal(teclear(crearCalculadora(), "7 + 5 ="), "12");
  assert.equal(teclear(crearCalculadora(), "9 − 4 ="), "5");
  assert.equal(teclear(crearCalculadora(), "6 × 7 ="), "42");
  assert.equal(teclear(crearCalculadora(), "8 ÷ 4 ="), "2");
});

test("calculadora: decimales sin errores de punto flotante", () => {
  assert.equal(teclear(crearCalculadora(), "0 . 1 + 0 . 2 ="), "0.3");
  assert.equal(teclear(crearCalculadora(), "1 ÷ 3 ="), "0.333333333333");
});

test("calculadora: encadenar, cambiar operador, signo y porcentaje", () => {
  assert.equal(teclear(crearCalculadora(), "2 + 3 + 4 ="), "9");
  assert.equal(teclear(crearCalculadora(), "5 + × 3 ="), "15");
  assert.equal(teclear(crearCalculadora(), "5 ± + 2 ="), "-3");
  assert.equal(teclear(crearCalculadora(), "5 0 %"), "0.5");
  assert.equal(teclear(crearCalculadora(), "2 0 0 + 1 0 % ="), "200.1");
});

test("calculadora: borrar y limpiar", () => {
  assert.equal(teclear(crearCalculadora(), "1 2 3 <"), "12");
  assert.equal(teclear(crearCalculadora(), "5 <"), "0");
  assert.equal(teclear(crearCalculadora(), "1 2 + 3 C"), "0");
});

test("calculadora: división entre cero muestra error y se recupera", () => {
  const c = crearCalculadora();
  assert.equal(teclear(c, "9 ÷ 0 ="), "Error");
  assert.equal(c.estado().error, true);
  assert.match(c.estado().expresion, /dividir entre 0/);
  assert.equal(teclear(c, "4 + 1 ="), "5");
});

test("calculadora: continuar con el resultado", () => {
  assert.equal(teclear(crearCalculadora(), "2 + 2 = × 5 ="), "20");
});

/* ---------- Fecha ---------- */
test("fecha: formato en español y saludo", () => {
  const f = new Date(2026, 10, 1, 9, 30);
  assert.match(F.formatearFechaLarga(f), /^Domingo, 1 de noviembre de 2026$/);
  assert.equal(F.saludoSegunHora(new Date(2026, 10, 1, 9)), "Buenos días");
  assert.equal(F.saludoSegunHora(new Date(2026, 10, 1, 15)), "Buenas tardes");
  assert.equal(F.saludoSegunHora(new Date(2026, 10, 1, 21)), "Buenas noches");
});

/* ---------- Carrito de compras (añadir, listar, modificar y eliminar) ---------- */
test("carrito: añadir, modificar información/cantidad y eliminar productos", () => {
  const latte = { id: 4, nombre: "Latte", precio: 58 };
  const galleta = { id: 9, nombre: "Galleta de avena", precio: 28 };

  let carrito = [];
  carrito = L.agregarItemCarrito(carrito, latte, 1, "");
  carrito = L.agregarItemCarrito(carrito, latte, 2, "Deslactosada");
  carrito = L.agregarItemCarrito(carrito, galleta, 1, "");

  assert.equal(carrito.length, 2);
  assert.equal(L.contarUnidadesCarrito(carrito), 4);
  assert.equal(carrito[0].cantidad, 3);
  assert.equal(carrito[0].nota, "Deslactosada");

  // Modificar información y cantidad de un producto en el carrito
  carrito = L.modificarItemCarrito(carrito, 4, {
    nombre: "Latte grande",
    cantidad: 2,
    precioUnitario: 65,
    nota: "Con leche de almendra",
  });
  assert.equal(carrito[0].nombre, "Latte grande");
  assert.equal(carrito[0].cantidad, 2);
  assert.equal(carrito[0].precioUnitario, 65);
  assert.equal(carrito[0].nota, "Con leche de almendra");

  // Eliminar un producto del carrito
  carrito = L.eliminarItemCarrito(carrito, 9);
  assert.equal(carrito.length, 1);
  assert.equal(carrito[0].productoId, 4);

  // Si la cantidad se modifica a 0, se elimina del carrito
  carrito = L.modificarItemCarrito(carrito, 4, { cantidad: 0 });
  assert.equal(carrito.length, 0);
});

test("validarEdicionCarrito", () => {
  const base = { nombre: "Latte deslactosado", precioUnitario: "58.00", cantidad: "2", nota: "Sin azúcar", maxExistencias: 10 };
  assert.equal(V.validarEdicionCarrito(base).valido, true);
  assert.ok(V.validarEdicionCarrito({ ...base, nombre: "ab" }).errores.nombre);
  assert.ok(V.validarEdicionCarrito({ ...base, precioUnitario: "0" }).errores.precioUnitario);
  assert.ok(V.validarEdicionCarrito({ ...base, cantidad: "0" }).errores.cantidad);
  assert.ok(V.validarEdicionCarrito({ ...base, cantidad: "15" }).errores.cantidad);
});

test("servidor local y endpoints de sesión y carrito (/php/sesion.php y /php/carrito.php)", async () => {
  const { Readable } = require("node:stream");
  const { manejarScriptPhp } = require("../servidor.js");

  async function invocarEndpoint(ruta, metodo, cuerpo, cookie) {
    const req = Readable.from(cuerpo ? [Buffer.from(JSON.stringify(cuerpo))] : []);
    req.method = metodo;
    req.url = ruta;
    req.headers = { host: "localhost", cookie: cookie || "" };

    let codigo = 200;
    const cabeceras = {};
    let salida = "";
    const res = {
      setHeader(k, v) { cabeceras[k.toLowerCase()] = v; },
      writeHead(c, h) {
        codigo = c;
        Object.entries(h || {}).forEach(([k, v]) => { cabeceras[k.toLowerCase()] = v; });
      },
      end(texto) { salida = texto || ""; },
    };

    const urlObj = new URL(ruta, "http://localhost");
    await manejarScriptPhp(urlObj, req, res);
    return { codigo, cabeceras, datos: JSON.parse(salida) };
  }

  // 1. Iniciar sesión en el servidor
  const rSesion = await invocarEndpoint("/php/sesion.php", "POST", { accion: "iniciar", correo: "cajero@poscafe.mx" }, "");
  const cookie = (rSesion.cabeceras["set-cookie"] || "").split(";")[0];
  assert.equal(rSesion.datos.ok, true);
  assert.equal(rSesion.datos.sesion.nombre, "Cajero de ejemplo");

  // 2. Añadir producto al carrito en sesión
  const rAdd = await invocarEndpoint("/php/carrito.php", "POST", {
    accion: "agregar", productoId: 3, nombre: "Capuchino", precioUnitario: 55, cantidad: 2,
  }, cookie);
  assert.equal(rAdd.datos.totalUnidades, 2);
  assert.equal(rAdd.datos.subtotal, 110);
  assert.equal(rAdd.datos.usuario.nombre, "Cajero de ejemplo");

  // 3. Modificar producto en el carrito (cantidad e información)
  const rMod = await invocarEndpoint("/php/carrito.php", "POST", {
    accion: "modificar", productoId: 3, nombre: "Capuchino grande", precioUnitario: 60, cantidad: 3, nota: "Sin canela",
  }, cookie);
  assert.equal(rMod.datos.carrito[0].nombre, "Capuchino grande");
  assert.equal(rMod.datos.carrito[0].cantidad, 3);
  assert.equal(rMod.datos.carrito[0].nota, "Sin canela");
  assert.equal(rMod.datos.subtotal, 180);

  // 4. Eliminar producto del carrito
  const rDel = await invocarEndpoint("/php/carrito.php", "POST", {
    accion: "eliminar", productoId: 3,
  }, cookie);
  assert.equal(rDel.datos.carrito.length, 0);
});
