# POSCafé - Carrito de Compras, Sesiones y Base de Datos

Sistema de punto de venta para cafeterías desarrollado para *Desarrollo de Aplicaciones Web*.

**Equipo:** Angel Zared Fuentes Lopez, Diego Isaiah Lizarraga Ramírez y Diego Eduardo Sanchez Vazquez.

## Cumplimiento de los requerimientos

### 1. Carrito de compras y sesiones (Imagen 1 - Paso 1)
- **Añadir productos**: En `pos.html` (`js/pos.js` y `php/carrito.php?accion=agregar`) se agregan productos al carrito verificando las existencias disponibles.
- **Modificar productos**: Permite cambiar la cantidad rápidamente (`+` / `−`) o abrir el botón **Editar** de cada línea del carrito para modificar su **nombre/variante**, **cantidad**, **precio unitario** y **nota/indicación** (`js/pos.js` y `php/carrito.php?accion=modificar`).
- **Eliminar productos**: Permite retirar cualquier producto individualmente (`×`) o vaciar todo el carrito con el botón **Vaciar carrito** (`php/carrito.php?accion=eliminar` y `accion=vaciar`).
- **Listar productos**: Muestra los productos almacenados en el carrito en `pos.html` (con precios unitarios, notas, subtotales, descuento y total) y conserva el carrito en la sesión durante la navegación entre todas las páginas (mostrando también el contador de unidades en la barra de navegación superior).
- **Mostrar al usuario con manejo de sesiones**: Muestra el nombre y rol del usuario activo tanto en el menú superior de todas las páginas (`js/app.js`) como en el encabezado del carrito (`Atendido por (sesión)` en `pos.html`), respaldado en `$_SESSION['usuario']` (`php/sesion.php`).

### 2. Servidor local, scripts del servidor y base de datos (Imagen 2 - Pasos 1 a 4)
- **Paso 1 y Paso 2 (Servidor local y sitio web)**:
  - Compatible con **XAMPP / WAMP / Laragon** colocando la carpeta `poscafe` dentro de `htdocs/poscafe`.
  - Incluye también `servidor.js` para levantar el servidor local inmediatamente con Node.js (`node servidor.js` en `http://localhost:8000`).
- **Paso 3 (Scripts del lado del servidor en `php/`)**:
  - `php/conexion.php`: Inicia `session_start()` y conecta a MySQL (`poscafe`) mediante PDO.
  - `php/sesion.php`: Inicia, consulta y cierra la sesión del usuario en `$_SESSION['usuario']`.
  - `php/carrito.php`: Gestiona el carrito de compras en `$_SESSION['carrito']` (listar, añadir, modificar, eliminar y vaciar).
  - `php/productos.php`: Consulta categorías y gestiona el alta, edición, baja y existencias de productos en MySQL.
  - `php/usuarios.php`: Consulta y registra usuarios con contraseña cifrada (`password_hash`).
  - `php/ventas.php`: Registra ventas y sus detalles en MySQL usando transacciones, descuenta existencias y vacía el carrito de la sesión.
- **Paso 4 (Base de datos en `sql/poscafe.sql`)**:
  - Script SQL completo que crea la base de datos `poscafe` y las tablas `categorias`, `usuarios`, `productos`, `ventas` y `detalle_ventas` con llaves primarias, llaves foráneas y datos iniciales.

## Cómo ejecutarlo

### Opción A: Con XAMPP / WAMP (Apache + PHP + MySQL)
1. Copia la carpeta `poscafe` dentro de `C:\xampp\htdocs\poscafe`.
2. Inicia **Apache** y **MySQL** en el panel de control de XAMPP.
3. Abre `http://localhost/phpmyadmin` e importa el archivo `sql/poscafe.sql`.
4. Abre `http://localhost/poscafe` en tu navegador.
   - Usuarios de prueba: `cajero@poscafe.mx` o `admin@poscafe.mx` (contraseña: `cafe1234`).

### Opción B: Con el servidor local incluido (Node.js)
```bash
node servidor.js
# Abre http://localhost:8000
```

## Pruebas automáticas

```bash
node --test tests/*.test.js
```
