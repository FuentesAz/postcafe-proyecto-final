/* ==========================================================
   servidor.js - Servidor Web local para POSCafé.
   Permite ejecutar el sitio y procesar los endpoints del lado
   del servidor (/php/sesion.php, /php/carrito.php,
   /php/productos.php, /php/usuarios.php, /php/ventas.php)
   con sesiones HTTP (PHPSESSID) directamente con Node.js,
   además de ser 100% compatible con Apache + PHP (XAMPP).
   Uso: node servidor.js
   ========================================================== */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PUERTO = Number(process.env.PORT) || 8000;
const RAIZ = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".sql": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/* Almacén de sesiones en el servidor indexado por PHPSESSID */
const sesionesServidor = new Map();

/* Datos en el servidor (equivalentes a las tablas en sql/poscafe.sql) */
const bdServidor = {
  categorias: [
    { id: 1, nombre: "Cafés" },
    { id: 2, nombre: "Bebidas frías" },
    { id: 3, nombre: "Postres" },
    { id: 4, nombre: "Alimentos" },
  ],
  productos: [
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
  ],
  usuarios: [
    { id: 1, nombre: "Administrador de ejemplo", correo: "admin@poscafe.mx", rol: "Administrador" },
    { id: 2, nombre: "Cajero de ejemplo", correo: "cajero@poscafe.mx", rol: "Cajero" },
  ],
  ventas: [],
};

function obtenerSesionPeticion(req, res) {
  const cookies = {};
  (req.headers.cookie || "").split(";").forEach((par) => {
    const idx = par.indexOf("=");
    if (idx > 0) {
      cookies[par.slice(0, idx).trim()] = par.slice(idx + 1).trim();
    }
  });
  let sid = cookies.PHPSESSID;
  if (!sid || !sesionesServidor.has(sid)) {
    sid = crypto.randomBytes(16).toString("hex");
    sesionesServidor.set(sid, { usuario: null, carrito: [] });
    res.setHeader("Set-Cookie", "PHPSESSID=" + sid + "; Path=/; HttpOnly; SameSite=Lax");
  }
  return sesionesServidor.get(sid);
}

function leerCuerpoJson(req) {
  return new Promise((resolve) => {
    let texto = "";
    req.on("data", (chunk) => { texto += chunk; });
    req.on("end", () => {
      if (!texto) return resolve({});
      try {
        resolve(JSON.parse(texto));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function enviarJson(res, datos, codigo = 200) {
  res.writeHead(codigo, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(datos));
}

function resumenCarrito(sesion) {
  const items = sesion.carrito || [];
  const subtotal = Math.round(items.reduce((s, i) => s + Number(i.precioUnitario) * Number(i.cantidad), 0) * 100) / 100;
  const totalUnidades = items.reduce((s, i) => s + Number(i.cantidad), 0);
  return {
    ok: true,
    carrito: items,
    totalUnidades: totalUnidades,
    subtotal: subtotal,
    usuario: sesion.usuario,
  };
}

async function manejarScriptPhp(urlObj, req, res) {
  const sesion = obtenerSesionPeticion(req, res);
  const ruta = urlObj.pathname;
  const metodo = req.method || "GET";
  const datos = metodo === "GET" ? Object.fromEntries(urlObj.searchParams) : await leerCuerpoJson(req);
  const accion = datos.accion || urlObj.searchParams.get("accion") || "";

  if (ruta === "/php/sesion.php") {
    if (metodo === "GET") {
      return enviarJson(res, { ok: true, sesion: sesion.usuario, carrito: sesion.carrito });
    }
    if (accion === "cerrar" || metodo === "DELETE") {
      sesion.usuario = null;
      return enviarJson(res, { ok: true, sesion: null });
    }
    const correo = String(datos.correo || "").trim();
    const u = bdServidor.usuarios.find((x) => x.correo.toLowerCase() === correo.toLowerCase());
    const base = correo.split("@")[0] || "Usuario";
    sesion.usuario = u || {
      id: null,
      nombre: base.charAt(0).toUpperCase() + base.slice(1),
      correo: correo,
      rol: "Cajero",
    };
    return enviarJson(res, { ok: true, sesion: sesion.usuario });
  }

  if (ruta === "/php/carrito.php") {
    if (metodo === "GET" || accion === "listar") {
      return enviarJson(res, resumenCarrito(sesion));
    }
    if (accion === "agregar") {
      const pid = Number(datos.productoId);
      const cant = Math.max(1, Number(datos.cantidad) || 1);
      const existente = sesion.carrito.find((i) => i.productoId === pid);
      if (existente) {
        existente.cantidad += cant;
      } else {
        sesion.carrito.push({
          productoId: pid,
          nombre: String(datos.nombre || ""),
          precioUnitario: Number(datos.precioUnitario) || 0,
          cantidad: cant,
          nota: String(datos.nota || ""),
        });
      }
      return enviarJson(res, resumenCarrito(sesion));
    }
    if (accion === "modificar" || metodo === "PUT") {
      const pid = Number(datos.productoId);
      const item = sesion.carrito.find((i) => i.productoId === pid);
      if (item) {
        if (datos.cantidad !== undefined) item.cantidad = Number(datos.cantidad);
        if (datos.nombre !== undefined && String(datos.nombre).trim() !== "") item.nombre = String(datos.nombre).trim();
        if (datos.precioUnitario !== undefined && Number(datos.precioUnitario) > 0) item.precioUnitario = Number(datos.precioUnitario);
        if (datos.nota !== undefined) item.nota = String(datos.nota).trim();
        if (item.cantidad <= 0) {
          sesion.carrito = sesion.carrito.filter((i) => i.productoId !== pid);
        }
      }
      return enviarJson(res, resumenCarrito(sesion));
    }
    if (accion === "eliminar" || accion === "vaciar" || metodo === "DELETE") {
      if (accion === "vaciar") {
        sesion.carrito = [];
      } else {
        const pid = Number(datos.productoId || urlObj.searchParams.get("productoId"));
        sesion.carrito = sesion.carrito.filter((i) => i.productoId !== pid);
      }
      return enviarJson(res, resumenCarrito(sesion));
    }
    if (accion === "sincronizar" && Array.isArray(datos.carrito)) {
      sesion.carrito = datos.carrito;
      return enviarJson(res, resumenCarrito(sesion));
    }
    return enviarJson(res, resumenCarrito(sesion));
  }

  if (ruta === "/php/productos.php") {
    if (metodo === "GET" && accion === "categorias") {
      return enviarJson(res, { ok: true, categorias: bdServidor.categorias });
    }
    if (metodo === "GET" || accion === "listar") {
      return enviarJson(res, { ok: true, productos: bdServidor.productos });
    }
    if (accion === "guardar") {
      const id = datos.id ? Number(datos.id) : bdServidor.productos.reduce((m, x) => Math.max(m, x.id), 0) + 1;
      const prod = {
        id: id,
        nombre: String(datos.nombre || "").trim(),
        descripcion: String(datos.descripcion || "").trim(),
        precio: Number(datos.precio) || 0,
        existencias: Number(datos.existencias) || 0,
        categoriaId: Number(datos.categoriaId) || 1,
      };
      const i = bdServidor.productos.findIndex((p) => p.id === id);
      if (i >= 0) bdServidor.productos[i] = prod; else bdServidor.productos.push(prod);
      return enviarJson(res, { ok: true, producto: prod });
    }
    if (accion === "existencias") {
      const p = bdServidor.productos.find((x) => x.id === Number(datos.id));
      if (p) p.existencias = Number(datos.existencias) || 0;
      return enviarJson(res, { ok: true, producto: p });
    }
    if (accion === "eliminar") {
      bdServidor.productos = bdServidor.productos.filter((p) => p.id !== Number(datos.id));
      return enviarJson(res, { ok: true });
    }
  }

  if (ruta === "/php/usuarios.php") {
    if (metodo === "GET") {
      return enviarJson(res, { ok: true, usuarios: bdServidor.usuarios });
    }
    const id = bdServidor.usuarios.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    const nuevo = { id: id, nombre: datos.nombre, correo: datos.correo, rol: datos.rol || "Cajero" };
    bdServidor.usuarios.push(nuevo);
    return enviarJson(res, { ok: true, usuario: nuevo });
  }

  if (ruta === "/php/ventas.php") {
    if (metodo === "GET") {
      return enviarJson(res, { ok: true, ventas: bdServidor.ventas });
    }
    const id = bdServidor.ventas.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    const nueva = Object.assign({}, datos, { id: id });
    bdServidor.ventas.push(nueva);
    sesion.carrito = [];
    return enviarJson(res, { ok: true, venta: nueva });
  }

  return enviarJson(res, { ok: false, error: "Endpoint no encontrado" }, 404);
}

const servidor = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url || "/", "http://" + (req.headers.host || "localhost"));

  if (urlObj.pathname.startsWith("/php/")) {
    return manejarScriptPhp(urlObj, req, res);
  }

  const relativo = urlObj.pathname === "/" ? "/index.html" : decodeURIComponent(urlObj.pathname);
  const rutaArchivo = path.normalize(path.join(RAIZ, relativo));

  if (!rutaArchivo.startsWith(RAIZ)) {
    res.writeHead(403);
    return res.end("Acceso denegado");
  }

  fs.readFile(rutaArchivo, (err, contenido) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Archivo no encontrado");
    }
    const ext = path.extname(rutaArchivo).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(contenido);
  });
});

if (require.main === module) {
  servidor.listen(PUERTO, () => {
    console.log("Servidor local de POSCafé activo en http://localhost:" + PUERTO);
  });
}

module.exports = { servidor, manejarScriptPhp };
