const CLAVES = {
  productos: "poscafe_productos",
  usuarios: "poscafe_usuarios",
  ventas: "poscafe_ventas",
  sesion: "poscafe_sesion",
  carrito: "poscafe_carrito",
};

function siguienteId(lista) {
  return lista.reduce((max, x) => Math.max(max, x.id), 0) + 1;
}

/* Envía peticiones asíncronas al servidor PHP cuando se ejecuta en http(s):// */
function enviarAlServidor(ruta, metodo, cuerpo, alResponder) {
  if (typeof window === "undefined" || !window.fetch || window.location.protocol === "file:") {
    return;
  }
  const opciones = {
    method: metodo || "GET",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
  };
  if (cuerpo && metodo !== "GET") {
    opciones.body = JSON.stringify(cuerpo);
  }
  window.fetch(ruta, opciones)
    .then((r) => (r.ok ? r.json() : null))
    .then((datos) => {
      if (datos && datos.ok && typeof alResponder === "function") {
        alResponder(datos);
      }
    })
    .catch(() => { /* Si se abre sin BackEnd activo, conserva el respaldo local */ });
}

const Api = {
  /* GET php/productos.php?accion=categorias */
  listarCategorias() {
    return CATEGORIAS_BASE.map((c) => ({ id: c.id, nombre: c.nombre }));
  },

  /* GET php/productos.php */
  listarProductos() {
    return Almacen.leerOCrear(CLAVES.productos, () => PRODUCTOS_BASE);
  },
  /* POST php/productos.php (nuevo o editar) */
  guardarProducto(producto) {
    const lista = Api.listarProductos();
    let guardado = producto;
    if (producto.id) {
      const i = lista.findIndex((p) => p.id === producto.id);
      if (i >= 0) lista[i] = producto; else lista.push(producto);
    } else {
      guardado = Object.assign({}, producto, { id: siguienteId(lista) });
      lista.push(guardado);
    }
    Almacen.guardar(CLAVES.productos, lista);
    enviarAlServidor("php/productos.php", "POST", Object.assign({ accion: "guardar" }, guardado));
    return guardado;
  },
  /* DELETE php/productos.php */
  eliminarProducto(id) {
    const lista = Api.listarProductos().filter((p) => p.id !== id);
    Almacen.guardar(CLAVES.productos, lista);
    enviarAlServidor("php/productos.php", "POST", { accion: "eliminar", id: id });
  },
  /* PATCH php/productos.php (existencias) */
  actualizarExistencias(id, cantidad) {
    const lista = Api.listarProductos();
    const producto = lista.find((p) => p.id === id);
    if (!producto) return null;
    producto.existencias = cantidad;
    Almacen.guardar(CLAVES.productos, lista);
    enviarAlServidor("php/productos.php", "POST", { accion: "existencias", id: id, existencias: cantidad });
    return producto;
  },

  /* ---------- CARRITO DE COMPRAS CON SESIONES ---------- */

  /* Listar productos almacenados en el carrito de la sesión */
  obtenerCarrito() {
    const guardado = Almacen.leer(CLAVES.carrito);
    return Array.isArray(guardado) ? guardado : [];
  },
  guardarCarrito(carrito) {
    const limpio = Array.isArray(carrito) ? carrito : [];
    Almacen.guardar(CLAVES.carrito, limpio);
    if (typeof window !== "undefined" && typeof window.actualizarInsigniaCarrito === "function") {
      window.actualizarInsigniaCarrito();
    }
    return limpio;
  },
  /* Añadir producto al carrito */
  agregarAlCarrito(producto, cantidad, nota) {
    const actual = Api.obtenerCarrito();
    const nuevo = agregarItemCarrito(actual, producto, cantidad, nota);
    Api.guardarCarrito(nuevo);
    enviarAlServidor("php/carrito.php", "POST", {
      accion: "agregar",
      productoId: producto.id,
      nombre: producto.nombre,
      precioUnitario: producto.precio,
      cantidad: cantidad || 1,
      nota: nota || "",
    });
    return nuevo;
  },
  /* Modificar cantidad o información (nombre, precio, nota) de un producto en el carrito */
  modificarEnCarrito(productoId, cambios) {
    const actual = Api.obtenerCarrito();
    const nuevo = modificarItemCarrito(actual, productoId, cambios);
    Api.guardarCarrito(nuevo);
    enviarAlServidor("php/carrito.php", "POST", Object.assign({
      accion: "modificar",
      productoId: productoId,
    }, cambios));
    return nuevo;
  },
  /* Eliminar un producto del carrito */
  eliminarDelCarrito(productoId) {
    const actual = Api.obtenerCarrito();
    const nuevo = eliminarItemCarrito(actual, productoId);
    Api.guardarCarrito(nuevo);
    enviarAlServidor("php/carrito.php", "POST", { accion: "eliminar", productoId: productoId });
    return nuevo;
  },
  /* Vaciar todo el carrito */
  vaciarCarrito() {
    Api.guardarCarrito([]);
    enviarAlServidor("php/carrito.php", "POST", { accion: "vaciar" });
    return [];
  },

  /* ---------- USUARIOS Y VENTAS ---------- */

  /* GET php/usuarios.php */
  listarUsuarios() {
    return Almacen.leerOCrear(CLAVES.usuarios, () => USUARIOS_BASE);
  },
  /* POST php/usuarios.php */
  crearUsuario(usuario) {
    const lista = Api.listarUsuarios();
    const nuevo = { id: siguienteId(lista), nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol };
    lista.push(nuevo);
    Almacen.guardar(CLAVES.usuarios, lista);
    enviarAlServidor("php/usuarios.php", "POST", {
      nombre: usuario.nombre,
      correo: usuario.correo,
      contrasena: usuario.contrasena || "",
      rol: usuario.rol,
    });
    return nuevo;
  },

  /* GET php/ventas.php */
  listarVentas() {
    return Almacen.leerOCrear(CLAVES.ventas, crearVentasBase);
  },
  /* POST php/ventas.php (guarda la venta, descuenta existencias y limpia el carrito en sesión) */
  registrarVenta(venta) {
    const ventas = Api.listarVentas();
    const nueva = Object.assign({}, venta, { id: siguienteId(ventas) });
    ventas.push(nueva);
    Almacen.guardar(CLAVES.ventas, ventas);
    const productos = Api.listarProductos();
    nueva.detalle.forEach((d) => {
      const p = productos.find((x) => x.id === d.productoId);
      if (p) p.existencias = Math.max(0, p.existencias - d.cantidad);
    });
    Almacen.guardar(CLAVES.productos, productos);
    Api.vaciarCarrito();
    enviarAlServidor("php/ventas.php", "POST", nueva);
    return nueva;
  },

  /* ---------- MANEJO DE SESIÓN DEL USUARIO ---------- */

  /* POST php/sesion.php */
  iniciarSesion(correo, contrasena) {
    const u = Api.listarUsuarios().find((x) => x.correo.toLowerCase() === correo.toLowerCase());
    const nombreExtraido = correo.split("@")[0] || correo;
    const sesion = {
      id: u ? u.id : null,
      nombre: u ? u.nombre : nombreExtraido.charAt(0).toUpperCase() + nombreExtraido.slice(1),
      correo: correo,
      rol: u ? u.rol : "Cajero",
    };
    Almacen.guardar(CLAVES.sesion, sesion);
    enviarAlServidor("php/sesion.php", "POST", {
      accion: "iniciar",
      correo: correo,
      contrasena: contrasena || "",
    });
    return sesion;
  },
  obtenerSesion() {
    return Almacen.leer(CLAVES.sesion);
  },
  cerrarSesion() {
    Almacen.borrar(CLAVES.sesion);
    enviarAlServidor("php/sesion.php", "POST", { accion: "cerrar" });
  },

  /* Sincroniza sesión y carrito desde php/sesion.php cuando corre en servidor local */
  sincronizarConServidor(alActualizar) {
    enviarAlServidor("php/sesion.php", "GET", null, (datos) => {
      let huboCambios = false;
      if (datos.sesion && !Api.obtenerSesion()) {
        Almacen.guardar(CLAVES.sesion, datos.sesion);
        huboCambios = true;
      } else if (!datos.sesion && Api.obtenerSesion()) {
        const local = Api.obtenerSesion();
        enviarAlServidor("php/sesion.php", "POST", { accion: "iniciar", correo: local.correo });
      }
      if (Array.isArray(datos.carrito)) {
        const localCarrito = Api.obtenerCarrito();
        if (localCarrito.length === 0 && datos.carrito.length > 0) {
          Almacen.guardar(CLAVES.carrito, datos.carrito);
          huboCambios = true;
        } else if (localCarrito.length > 0 && datos.carrito.length === 0) {
          enviarAlServidor("php/carrito.php", "POST", { accion: "sincronizar", carrito: localCarrito });
        }
      }
      if (huboCambios && typeof alActualizar === "function") {
        alActualizar();
      }
    });
  },

  /* Solo para pruebas: vuelve a los datos de ejemplo. */
  restablecerDatos() {
    Almacen.borrar(CLAVES.productos);
    Almacen.borrar(CLAVES.usuarios);
    Almacen.borrar(CLAVES.ventas);
    Api.vaciarCarrito();
  },
};
