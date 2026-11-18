-- ==========================================================
-- POSCafé - Script de Base de Datos (MySQL / MariaDB)
-- Paso 4: Preparación de las tablas e información inicial
-- ==========================================================

CREATE DATABASE IF NOT EXISTS poscafe
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE poscafe;

-- 1. Tabla de Categorías
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 2. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('Administrador', 'Cajero') NOT NULL DEFAULT 'Cajero',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(120) DEFAULT '',
  precio DECIMAL(10, 2) NOT NULL,
  existencias INT NOT NULL DEFAULT 0,
  categoria_id INT NOT NULL,
  CONSTRAINT fk_productos_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 4. Tabla de Ventas
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT NULL,
  metodo_pago ENUM('Efectivo', 'Tarjeta', 'Transferencia') NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  descuento DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_ventas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Tabla de Detalle de Ventas
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  nombre_producto VARCHAR(80) NOT NULL,
  nota VARCHAR(120) DEFAULT '',
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_detalle_venta
    FOREIGN KEY (venta_id) REFERENCES ventas(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto
    FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ==========================================================
-- Datos iniciales (Seed)
-- ==========================================================

INSERT INTO categorias (id, nombre) VALUES
  (1, 'Cafés'),
  (2, 'Bebidas frías'),
  (3, 'Postres'),
  (4, 'Alimentos')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Contraseña de ejemplo para ambos usuarios: cafe1234
INSERT INTO usuarios (id, nombre, correo, contrasena, rol) VALUES
  (1, 'Administrador de ejemplo', 'admin@poscafe.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador'),
  (2, 'Cajero de ejemplo', 'cajero@poscafe.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cajero')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), rol = VALUES(rol);

INSERT INTO productos (id, nombre, descripcion, precio, existencias, categoria_id) VALUES
  (1, 'Espresso', 'Shot sencillo de café de la casa', 35.00, 40, 1),
  (2, 'Americano', 'Espresso con agua caliente', 40.00, 40, 1),
  (3, 'Capuchino', 'Espresso con leche y espuma', 55.00, 30, 1),
  (4, 'Latte', 'Espresso con abundante leche vaporizada', 58.00, 30, 1),
  (5, 'Frappé de moka', 'Café frío con chocolate y hielo', 68.00, 20, 2),
  (6, 'Té helado de limón', 'Té negro con limón y hielo', 45.00, 25, 2),
  (7, 'Limonada mineral', 'Limón natural con agua mineral', 42.00, 25, 2),
  (8, 'Pastel de zanahoria', 'Rebanada con betún de queso crema', 60.00, 6, 3),
  (9, 'Galleta de avena', 'Galleta artesanal con pasas', 28.00, 35, 3),
  (10, 'Sándwich de pavo', 'Pan de masa madre, pavo y queso', 85.00, 12, 4),
  (11, 'Bagel con queso crema', 'Bagel tostado con queso crema', 65.00, 14, 4),
  (12, 'Croissant', 'Croissant de mantequilla', 38.00, 18, 4)
ON DUPLICATE KEY UPDATE
  descripcion = VALUES(descripcion),
  precio = VALUES(precio),
  existencias = VALUES(existencias),
  categoria_id = VALUES(categoria_id);

INSERT INTO ventas (id, fecha, usuario_id, metodo_pago, subtotal, descuento, total) VALUES
  (1, DATE_SUB(NOW(), INTERVAL 2 DAY), 2, 'Efectivo', 138.00, 0.00, 138.00),
  (2, DATE_SUB(NOW(), INTERVAL 1 DAY), 2, 'Tarjeta', 163.00, 16.30, 146.70),
  (3, DATE_SUB(NOW(), INTERVAL 1 DAY), 1, 'Transferencia', 254.00, 0.00, 254.00)
ON DUPLICATE KEY UPDATE total = VALUES(total);

INSERT INTO detalle_ventas (id, venta_id, producto_id, nombre_producto, nota, cantidad, precio_unitario) VALUES
  (1, 1, 3, 'Capuchino', '', 2, 55.00),
  (2, 1, 9, 'Galleta de avena', '', 1, 28.00),
  (3, 2, 4, 'Latte', '', 1, 58.00),
  (4, 2, 8, 'Pastel de zanahoria', '', 1, 60.00),
  (5, 2, 6, 'Té helado de limón', '', 1, 45.00),
  (6, 3, 10, 'Sándwich de pavo', '', 2, 85.00),
  (7, 3, 7, 'Limonada mineral', '', 2, 42.00)
ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad);
