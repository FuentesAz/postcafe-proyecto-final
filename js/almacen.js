const Almacen = {
  leer(clave) {
    try {
      const enSesion = window.sessionStorage ? window.sessionStorage.getItem(clave) : null;
      const texto = enSesion !== null ? enSesion : window.localStorage.getItem(clave);
      return texto === null ? null : JSON.parse(texto);
    } catch (e) {
      return null;
    }
  },
  guardar(clave, valor) {
    try {
      const json = JSON.stringify(valor);
      if (window.sessionStorage) window.sessionStorage.setItem(clave, json);
      window.localStorage.setItem(clave, json);
      return true;
    } catch (e) {
      return false;
    }
  },
  borrar(clave) {
    try {
      if (window.sessionStorage) window.sessionStorage.removeItem(clave);
      window.localStorage.removeItem(clave);
    } catch (e) { /* sin acceso al almacenamiento */ }
  },
  /* Si no hay nada guardado, crea los datos de ejemplo y los guarda. */
  leerOCrear(clave, creador) {
    const guardado = Almacen.leer(clave);
    if (guardado !== null) return guardado;
    const nuevo = JSON.parse(JSON.stringify(creador()));
    Almacen.guardar(clave, nuevo);
    return nuevo;
  },
};
