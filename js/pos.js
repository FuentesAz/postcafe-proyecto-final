(function () {
  const categorias = Api.listarCategorias();
  let productos = Api.listarProductos();
  let carrito = Api.obtenerCarrito(); // Conservado en sesión durante la navegación
  let categoriaActiva = 0;            // 0 = todas

  const filtros = document.getElementById("filtros-categoria");
  const listaProductos = document.getElementById("lista-productos");
  const listaCarrito = document.getElementById("carrito");
  const textoVacio = document.getElementById("carrito-vacio");
  const resumenUnidades = document.getElementById("resumen-unidades");
  const btnVaciar = document.getElementById("btn-vaciar");
  const ticketUsuario = document.getElementById("ticket-usuario");

  const formEditar = document.getElementById("form-editar-carrito");
  const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");

  const form = document.getElementById("form-pago");
  const grupoRecibido = document.getElementById("grupo-recibido");
  const textoCambio = document.getElementById("cambio");

  function enCarrito(id) {
    const item = carrito.find((i) => i.productoId === id);
    return item ? item.cantidad : 0;
  }

  function descuentoActual() {
    const bruto = form.elements.descuento.value.trim();
    const n = Number(bruto);
    return bruto !== "" && !isNaN(n) && n >= 0 && n <= 100 ? n : 0;
  }

  /* ---------- Mostrar al usuario de la sesión ---------- */
  function pintarUsuarioSesion() {
    if (!ticketUsuario) return;
    const sesion = Api.obtenerSesion();
    if (sesion && sesion.nombre) {
      ticketUsuario.textContent = sesion.nombre + (sesion.rol ? " (" + sesion.rol + ")" : "");
    } else {
      ticketUsuario.textContent = "Invitado (sin sesión)";
    }
  }

  window.alCambiarSesion = function () {
    carrito = Api.obtenerCarrito();
    pintarUsuarioSesion();
    refrescar();
  };

  function pintarFiltros() {
    const todas = [{ id: 0, nombre: "Todos" }].concat(categorias);
    filtros.innerHTML = todas.map((c) =>
      '<button type="button" class="btn btn-sm ' + (c.id === categoriaActiva ? "btn-dark" : "btn-outline-dark") +
      '" data-categoria="' + c.id + '" aria-pressed="' + (c.id === categoriaActiva) + '">' +
      escaparHtml(c.nombre) + "</button>"
    ).join("");
  }

  function pintarProductos() {
    const visibles = productos.filter((p) => categoriaActiva === 0 || p.categoriaId === categoriaActiva);
    listaProductos.innerHTML = visibles.length ? visibles.map((p) => {
      const disponibles = p.existencias - enCarrito(p.id);
      const agotado = disponibles <= 0;
      return '<div class="col-6 col-md-4"><button type="button" class="producto cat-' + p.categoriaId +
        '" data-id="' + p.id + '"' + (agotado ? " disabled" : "") + ">" +
        '<span class="producto-nombre">' + escaparHtml(p.nombre) + "</span>" +
        '<span class="producto-precio">' + formatearMoneda(p.precio) + "</span>" +
        '<span class="producto-stock">' + (agotado ? "Agotado" : disponibles + " disponibles") + "</span>" +
        "</button></div>";
    }).join("") : '<p class="text-secondary">No hay productos en esta categoría.</p>';
  }

  function pintarCarrito() {
    listaCarrito.innerHTML = carrito.map((i) =>
      '<li class="linea">' +
      '<div class="linea-nombre">' +
      escaparHtml(i.nombre) +
      "<small>" + formatearMoneda(i.precioUnitario) + " c/u</small>" +
      (i.nota ? '<small class="linea-nota">Nota: ' + escaparHtml(i.nota) + "</small>" : "") +
      "</div>" +
      '<div class="linea-cantidad" role="group" aria-label="Cantidad de ' + escaparHtml(i.nombre) + '">' +
      '<button type="button" class="btn btn-sm btn-outline-secondary" data-accion="menos" data-id="' + i.productoId + '" aria-label="Quitar una unidad">−</button>' +
      "<span>" + i.cantidad + "</span>" +
      '<button type="button" class="btn btn-sm btn-outline-secondary" data-accion="mas" data-id="' + i.productoId + '" aria-label="Agregar una unidad">+</button>' +
      "</div>" +
      '<div class="linea-importe">' + formatearMoneda(i.precioUnitario * i.cantidad) + "</div>" +
      '<div class="linea-acciones">' +
      '<button type="button" class="btn btn-sm btn-outline-primary py-0 px-2" data-accion="editar" data-id="' + i.productoId + '" aria-label="Modificar ' + escaparHtml(i.nombre) + '">Editar</button>' +
      '<button type="button" class="btn-close" data-accion="quitar" data-id="' + i.productoId + '" aria-label="Quitar ' + escaparHtml(i.nombre) + ' del carrito"></button>' +
      "</div>" +
      "</li>"
    ).join("");

    const totalUnidades = contarUnidadesCarrito(carrito);
    if (resumenUnidades) resumenUnidades.textContent = totalUnidades;
    if (btnVaciar) btnVaciar.classList.toggle("d-none", carrito.length === 0);
    textoVacio.classList.toggle("d-none", carrito.length > 0);
  }

  function actualizarTotales() {
    const t = calcularTotales(carrito, descuentoActual());
    document.getElementById("t-subtotal").textContent = formatearMoneda(t.subtotal);
    document.getElementById("t-descuento").textContent = "−" + formatearMoneda(t.descuento);
    document.getElementById("t-total").textContent = formatearMoneda(t.total);

    const esEfectivo = form.elements.metodo.value === "Efectivo";
    grupoRecibido.classList.toggle("d-none", !esEfectivo);
    const recibido = form.elements.recibido.value.trim();
    if (esEfectivo && recibido !== "" && !isNaN(Number(recibido)) && Number(recibido) >= t.total && t.total > 0) {
      textoCambio.textContent = "Cambio: " + formatearMoneda(calcularCambio(recibido, t.total));
    } else {
      textoCambio.textContent = "";
    }
  }

  function refrescar() {
    pintarProductos();
    pintarCarrito();
    actualizarTotales();
    if (form.dataset.intentado === "1") form.dispatchEvent(new Event("change"));
  }

  function agregar(id) {
    const p = productos.find((x) => x.id === id);
    if (!p) return;
    if (enCarrito(id) >= p.existencias) {
      avisar("No hay más existencias de " + p.nombre + ".", "warning");
      return;
    }
    carrito = Api.agregarAlCarrito(p, 1, "");
    refrescar();
  }

  function cambiarCantidad(id, delta) {
    const item = carrito.find((i) => i.productoId === id);
    const p = productos.find((x) => x.id === id);
    if (!item || !p) return;
    if (delta > 0 && item.cantidad >= p.existencias) {
      avisar("No hay más existencias de " + p.nombre + ".", "warning");
      return;
    }
    const nuevaCantidad = item.cantidad + delta;
    carrito = Api.modificarEnCarrito(id, { cantidad: nuevaCantidad });
    if (nuevaCantidad <= 0 && Number(formEditar.elements.productoId.value) === id) {
      cerrarEdicion();
    }
    refrescar();
  }

  function quitar(id) {
    carrito = Api.eliminarDelCarrito(id);
    if (Number(formEditar.elements.productoId.value) === id) {
      cerrarEdicion();
    }
    avisar("Producto eliminado del carrito.", "info");
    refrescar();
  }

  function abrirEdicion(id) {
    const item = carrito.find((i) => i.productoId === id);
    const p = productos.find((x) => x.id === id);
    if (!item) return;
    controlEditar.reiniciar();
    formEditar.elements.productoId.value = String(item.productoId);
    formEditar.elements.nombre.value = item.nombre;
    formEditar.elements.cantidad.value = String(item.cantidad);
    formEditar.elements.cantidad.max = String(p ? p.existencias : 9999);
    formEditar.elements.precioUnitario.value = Number(item.precioUnitario).toFixed(2);
    formEditar.elements.nota.value = item.nota || "";
    formEditar.classList.remove("d-none");
    formEditar.elements.cantidad.focus();
  }

  function cerrarEdicion() {
    controlEditar.reiniciar();
    formEditar.elements.productoId.value = "";
    formEditar.classList.add("d-none");
  }

  function leerEdicionCarrito(f) {
    const datos = leerFormulario(f);
    const id = Number(datos.productoId);
    const p = productos.find((x) => x.id === id);
    datos.maxExistencias = p ? p.existencias : 9999;
    return datos;
  }

  function guardarEdicionCarrito(datos) {
    const id = Number(datos.productoId);
    carrito = Api.modificarEnCarrito(id, {
      nombre: datos.nombre.trim(),
      cantidad: Number(datos.cantidad),
      precioUnitario: Number(datos.precioUnitario),
      nota: (datos.nota || "").trim(),
    });
    cerrarEdicion();
    avisar("Producto modificado en el carrito.", "success");
    refrescar();
  }

  /* ---------- Eventos ---------- */
  filtros.addEventListener("click", (ev) => {
    const boton = ev.target.closest("[data-categoria]");
    if (!boton) return;
    categoriaActiva = Number(boton.getAttribute("data-categoria"));
    pintarFiltros();
    pintarProductos();
  });

  listaProductos.addEventListener("click", (ev) => {
    const boton = ev.target.closest("[data-id]");
    if (boton) agregar(Number(boton.getAttribute("data-id")));
  });

  listaCarrito.addEventListener("click", (ev) => {
    const boton = ev.target.closest("[data-accion]");
    if (!boton) return;
    const id = Number(boton.getAttribute("data-id"));
    const accion = boton.getAttribute("data-accion");
    if (accion === "mas") cambiarCantidad(id, 1);
    else if (accion === "menos") cambiarCantidad(id, -1);
    else if (accion === "editar") abrirEdicion(id);
    else quitar(id);
  });

  if (btnVaciar) {
    btnVaciar.addEventListener("click", () => {
      if (carrito.length === 0) return;
      carrito = Api.vaciarCarrito();
      cerrarEdicion();
      avisar("Se vació el carrito de compras.", "info");
      refrescar();
    });
  }

  btnCancelarEdicion.addEventListener("click", cerrarEdicion);

  form.addEventListener("input", actualizarTotales);
  form.addEventListener("change", actualizarTotales);

  /* ---------- Cobro con validación ---------- */
  function leerPago(f) {
    const datos = leerFormulario(f);
    datos.total = calcularTotales(carrito, descuentoActual()).total;
    datos.hayProductos = carrito.length > 0;
    return datos;
  }

  function cobrar(datos) {
    const t = calcularTotales(carrito, descuentoActual());
    const sesion = Api.obtenerSesion();
    const venta = Api.registrarVenta({
      fecha: new Date().toISOString(),
      usuarioId: sesion ? sesion.id : null,
      metodoPago: datos.metodo,
      subtotal: t.subtotal,
      descuento: t.descuento,
      total: t.total,
      detalle: carrito.map((i) => ({
        productoId: i.productoId,
        nombre: i.nombre,
        nota: i.nota || "",
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
    });
    let mensaje = "Venta #" + venta.id + " cobrada: " + formatearMoneda(t.total) + ".";
    if (datos.metodo === "Efectivo") {
      const cambio = calcularCambio(datos.recibido, t.total);
      if (cambio > 0) mensaje += " Cambio: " + formatearMoneda(cambio) + ".";
    }
    avisar(mensaje, "success");
    carrito = Api.obtenerCarrito();
    productos = Api.listarProductos();
    cerrarEdicion();
    control.reiniciar();
    refrescar();
  }

  const controlEditar = conectarFormulario(formEditar, {
    validar: validarEdicionCarrito,
    alValido: guardarEdicionCarrito,
    leer: leerEdicionCarrito,
  });

  const control = conectarFormulario(form, { validar: validarVenta, alValido: cobrar, leer: leerPago });

  pintarUsuarioSesion();
  pintarFiltros();
  refrescar();
})();
