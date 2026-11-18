/* ==========================================================
   formularios.js - Conecta las validaciones con la página:
   muestra u oculta los mensajes de error y avisos.
   ========================================================== */

/* Lee todos los campos del formulario en un objeto { nombre: valor }. */
function leerFormulario(form) {
  const datos = {};
  Array.from(form.elements).forEach((el) => {
    if (!el.name) return;
    if (el.type === "radio") {
      if (el.checked) datos[el.name] = el.value;
      else if (!(el.name in datos)) datos[el.name] = "";
    } else if (el.type === "checkbox") {
      datos[el.name] = el.checked;
    } else {
      datos[el.name] = el.value;
    }
  });
  return datos;
}

/* Marca un campo como inválido (o lo limpia si no hay mensaje). */
function marcarCampo(form, nombre, mensaje) {
  const campo = form.elements[nombre];
  const controles = !campo ? [] : campo instanceof RadioNodeList ? Array.from(campo) : [campo];
  controles.forEach((c) => {
    c.classList.toggle("is-invalid", !!mensaje);
    if (mensaje) c.setAttribute("aria-invalid", "true");
    else c.removeAttribute("aria-invalid");
  });
  const aviso = form.querySelector('[data-error="' + nombre + '"]');
  if (aviso) {
    aviso.textContent = mensaje || "";
    aviso.classList.toggle("d-block", !!mensaje);
  }
}

function mostrarErrores(form, errores) {
  form.querySelectorAll("[data-error]").forEach((aviso) => {
    const nombre = aviso.getAttribute("data-error");
    marcarCampo(form, nombre, errores[nombre] || "");
  });
}

/* Aviso flotante (Bootstrap alert) que desaparece solo. */
function avisar(mensaje, tipo) {
  const zona = document.getElementById("avisos");
  if (!zona) return;
  const caja = document.createElement("div");
  caja.className = "alert alert-" + (tipo || "success") + " shadow-sm";
  caja.setAttribute("role", tipo === "danger" ? "alert" : "status");
  caja.textContent = mensaje;
  zona.appendChild(caja);
  setTimeout(() => caja.remove(), 6000);
}

/* Conecta un formulario con su validación.
   opciones: { validar, alValido, leer (opcional) } */
function conectarFormulario(form, opciones) {
  const leer = opciones.leer || leerFormulario;
  form.setAttribute("novalidate", "");

  function revisar() {
    const datos = leer(form);
    const resultado = opciones.validar(datos);
    mostrarErrores(form, resultado.errores);
    return { datos: datos, valido: resultado.valido };
  }

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    form.dataset.intentado = "1";
    const r = revisar();
    if (r.valido) {
      opciones.alValido(r.datos, form);
    } else {
      const primero = form.querySelector(".is-invalid");
      if (primero) primero.focus();
    }
  });

  /* Después del primer intento, se revisa mientras la persona corrige. */
  const revisarSiYaIntento = () => {
    if (form.dataset.intentado === "1") revisar();
  };
  form.addEventListener("input", revisarSiYaIntento);
  form.addEventListener("change", revisarSiYaIntento);

  return {
    revisar: revisar,
    reiniciar() {
      form.reset();
      delete form.dataset.intentado;
      mostrarErrores(form, {});
    },
  };
}
