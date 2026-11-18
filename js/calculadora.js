/* ==========================================================
   calculadora.js - Calculadora funcional (suma, resta,
   multiplicación, división, porcentaje y cambio de signo).
   La lógica está separada de la pantalla para poder probarla.
   ========================================================== */

function crearCalculadora() {
  let pantalla = "0";
  let acumulado = null;
  let operador = null;
  let nuevoNumero = true;       // el siguiente dígito empieza un número nuevo
  let esperandoOperando = false; // se acaba de elegir un operador
  let error = false;
  let expresion = "";

  function limpiarNumero(n) {
    return parseFloat(n.toPrecision(12)); // evita 0.1 + 0.2 = 0.30000000000000004
  }
  function mostrar(n) {
    return String(limpiarNumero(n));
  }
  function calcular(a, b, op) {
    switch (op) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷":
        if (b === 0) throw new Error("No se puede dividir entre 0");
        return a / b;
      default: return b;
    }
  }
  function fallar(mensaje) {
    error = true;
    pantalla = "Error";
    expresion = mensaje;
    acumulado = null;
    operador = null;
  }

  const api = {
    digito(d) {
      if (error) api.limpiar();
      if (nuevoNumero) {
        pantalla = d;
        nuevoNumero = false;
      } else if (pantalla.replace(/[-.]/g, "").length < 12) {
        pantalla = pantalla === "0" ? d : pantalla + d;
      }
      esperandoOperando = false;
    },
    punto() {
      if (error) api.limpiar();
      if (nuevoNumero) {
        pantalla = "0.";
        nuevoNumero = false;
      } else if (!pantalla.includes(".")) {
        pantalla += ".";
      }
      esperandoOperando = false;
    },
    operador(op) {
      if (error) return;
      const actual = parseFloat(pantalla);
      if (operador !== null && esperandoOperando) {   // cambió de opinión: solo cambia el operador
        operador = op;
        expresion = mostrar(acumulado) + " " + op;
        return;
      }
      if (operador !== null) {                        // encadena: 2 + 3 + ...
        try {
          acumulado = limpiarNumero(calcular(acumulado, actual, operador));
        } catch (e) {
          fallar(e.message);
          return;
        }
        pantalla = String(acumulado);
      } else {
        acumulado = actual;
      }
      operador = op;
      nuevoNumero = true;
      esperandoOperando = true;
      expresion = mostrar(acumulado) + " " + op;
    },
    igual() {
      if (error || operador === null) return;
      const actual = parseFloat(pantalla);
      const a = acumulado;
      const op = operador;
      try {
        const resultado = limpiarNumero(calcular(a, actual, op));
        expresion = mostrar(a) + " " + op + " " + mostrar(actual) + " =";
        pantalla = String(resultado);
      } catch (e) {
        fallar(e.message);
        return;
      }
      acumulado = null;
      operador = null;
      nuevoNumero = true;
      esperandoOperando = false;
    },
    borrar() {
      if (error) { api.limpiar(); return; }
      if (nuevoNumero) return;
      pantalla = pantalla.length > 1 ? pantalla.slice(0, -1) : "0";
      if (pantalla === "-") pantalla = "0";
    },
    cambiarSigno() {
      if (error || pantalla === "0") return;
      pantalla = pantalla.startsWith("-") ? pantalla.slice(1) : "-" + pantalla;
      esperandoOperando = false;
    },
    porcentaje() {
      if (error) return;
      pantalla = String(limpiarNumero(parseFloat(pantalla) / 100));
      nuevoNumero = true;
      esperandoOperando = false;
    },
    limpiar() {
      pantalla = "0"; acumulado = null; operador = null;
      nuevoNumero = true; esperandoOperando = false; error = false; expresion = "";
    },
    estado() {
      return { pantalla: pantalla, expresion: expresion, error: error };
    },
  };
  return api;
}

/* ---------- Conexión con la página ---------- */
function conectarCalculadora(contenedor) {
  const calc = crearCalculadora();
  const salida = contenedor.querySelector("#calc-pantalla");
  const linea = contenedor.querySelector("#calc-expresion");

  function pintar() {
    const e = calc.estado();
    salida.textContent = e.pantalla;
    linea.textContent = e.expresion;
    salida.classList.toggle("calc-error", e.error);
  }

  function pulsar(tecla) {
    if (/^\d$/.test(tecla)) calc.digito(tecla);
    else if (tecla === ".") calc.punto();
    else if (["+", "−", "×", "÷"].indexOf(tecla) >= 0) calc.operador(tecla);
    else if (tecla === "=") calc.igual();
    else if (tecla === "C") calc.limpiar();
    else if (tecla === "⌫") calc.borrar();
    else if (tecla === "±") calc.cambiarSigno();
    else if (tecla === "%") calc.porcentaje();
    pintar();
  }

  contenedor.addEventListener("click", (ev) => {
    const boton = ev.target.closest("[data-tecla]");
    if (!boton) return;
    pulsar(boton.getAttribute("data-tecla"));
    // Si fue con el mouse, se quita el foco para que Enter sirva como "=".
    if (ev.detail > 0) boton.blur();
  });

  /* También funciona con el teclado (mientras no se esté escribiendo en un campo). */
  const teclado = { "-": "−", "*": "×", x: "×", "/": "÷", Enter: "=", "=": "=", Backspace: "⌫", Escape: "C", ",": ".", ".": "." };
  document.addEventListener("keydown", (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const enCalculadora = contenedor.contains(ev.target);
    if (ev.target !== document.body && !enCalculadora) return;
    // Con el foco en una tecla (por teclado), Enter y espacio la activan.
    if (enCalculadora && ev.target.tagName === "BUTTON" && (ev.key === "Enter" || ev.key === " ")) return;
    let tecla = null;
    if (/^\d$/.test(ev.key) || ev.key === "+") tecla = ev.key;
    else if (teclado[ev.key]) tecla = teclado[ev.key];
    if (tecla) {
      ev.preventDefault();
      pulsar(tecla);
    }
  });

  pintar();
}

if (typeof document !== "undefined") {
  const contenedorCalc = document.getElementById("calculadora");
  if (contenedorCalc) conectarCalculadora(contenedorCalc);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { crearCalculadora };
}
