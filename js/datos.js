/* ==========================================================
   datos.js - Datos de ejemplo.
   Tienen la misma forma que las tablas propuestas para la
   base de datos (Usuarios, Categorías, Productos, Ventas y
   Detalle de ventas). Cuando exista el BackEnd, estos datos
   vendrán de la API y este archivo ya no será necesario.
   ========================================================== */

/* Tabla Categorías */
const CATEGORIAS_BASE = [
  { id: 1, nombre: "Cafés" },
  { id: 2, nombre: "Bebidas frías" },
  { id: 3, nombre: "Postres" },
  { id: 4, nombre: "Alimentos" },
];

/* Tabla Productos (categoriaId será la llave foránea) */
const PRODUCTOS_BASE = [
  { id: 1, nombre: "Espresso", descripcion: "Shot sencillo de café de la casa", precio: 35, existencias: 40, categoriaId: 1 },
  { id: 2, nombre: "Americano", descripcion: "Espresso con agua caliente", precio: 40, existencias: 40, categoriaId: 1 },
  { id: 3, nombre: "Capuchino", descripcion: "Espresso con leche y espuma", precio: 55, existencias: 30, categoriaId: 1 },
  { id: 4, nombre: "Latte", descripcion: "Espresso con abundante leche vaporizada", precio: 58, existencias: 30, categoriaId: 1 },
  { id: 5, nombre: "Frappé de moka", descripcion: "Café frío con chocolate y hielo", precio: 68, existencias: 20, categoriaId: 2 },
  { id: 6, nombre: "Té helado de limón", descripcion: "Té negro con limón y hielo", precio: 45, existencias: 25, categoriaId: 2 },
  { id: 7, nombre: "Limonada mineral", descripcion: "Limón natural con agua mineral", precio: 42, existencias: 25, categoriaId: 2 },
  { id: 8, nombre: "Pastel de zanahoria", descripcion: "Rebanada con betún de queso crema", precio: 60, existencias: 6, categoriaId: 3 },
  { id: 9, nombre: "Galleta de avena", descripcion: "Galleta artesanal con pasas", precio: 28, existencias: 35, categoriaId: 3 },
  { id: 10, nombre: "Sándwich de pavo", descripcion: "Pan de masa madre, pavo y queso", precio: 85, existencias: 12, categoriaId: 4 },
  { id: 11, nombre: "Bagel con queso crema", descripcion: "Bagel tostado con queso crema", precio: 65, existencias: 14, categoriaId: 4 },
  { id: 12, nombre: "Croissant", descripcion: "Croissant de mantequilla", precio: 38, existencias: 18, categoriaId: 4 },
];

/* Tabla Usuarios. La contraseña NO se guarda en el FrontEnd:
   en la base de datos irá cifrada y solo la maneja el BackEnd. */
const USUARIOS_BASE = [
  { id: 1, nombre: "Administrador de ejemplo", correo: "admin@poscafe.mx", rol: "Administrador" },
  { id: 2, nombre: "Cajero de ejemplo", correo: "cajero@poscafe.mx", rol: "Cajero" },
];

const ROLES = ["Administrador", "Cajero"];
const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia"];

/* Tablas Ventas y Detalle de ventas (el detalle va dentro de cada venta). */
function crearVentasBase() {
  const hace = (dias, hora, min) => {
    const f = new Date();
    f.setDate(f.getDate() - dias);
    f.setHours(hora, min, 0, 0);
    return f.toISOString();
  };
  const item = (productoId, cantidad) => {
    const p = PRODUCTOS_BASE.find((x) => x.id === productoId);
    return { productoId: productoId, nombre: p.nombre, cantidad: cantidad, precioUnitario: p.precio };
  };
  const armar = (id, fecha, usuarioId, metodoPago, items, pct) => {
    const t = calcularTotales(items, pct);
    return {
      id: id, fecha: fecha, usuarioId: usuarioId, metodoPago: metodoPago,
      subtotal: t.subtotal, descuento: t.descuento, total: t.total, detalle: items,
    };
  };
  return [
    armar(1, hace(2, 9, 15), 2, "Efectivo", [item(3, 2), item(9, 1)], 0),
    armar(2, hace(1, 13, 40), 2, "Tarjeta", [item(4, 1), item(8, 1), item(6, 1)], 10),
    armar(3, hace(1, 17, 5), 1, "Transferencia", [item(10, 2), item(7, 2)], 0),
  ];
}
