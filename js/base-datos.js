/* base-datos.js - Botón para volver a los datos de ejemplo. */
document.getElementById("btn-restablecer").addEventListener("click", () => {
  if (window.confirm("Se borrarán los productos, usuarios y ventas que agregaste y volverán los datos de ejemplo. ¿Continuar?")) {
    Api.restablecerDatos();
    avisar("Datos de ejemplo restablecidos.", "success");
  }
});
