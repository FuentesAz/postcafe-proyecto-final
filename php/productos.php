<?php
/* ==========================================================
   php/productos.php - Scripts del servidor para gestionar
   Categorías, Productos e Inventario en MySQL (o respaldo en sesión).
   ========================================================== */

require_once __DIR__ . '/conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$datos  = $metodo === 'GET' ? $_GET : leerDatosEntrada();
$accion = $datos['accion'] ?? ($_GET['accion'] ?? 'listar');
$pdo    = obtenerConexion();

if ($metodo === 'GET' && $accion === 'categorias') {
    if ($pdo) {
        $filas = $pdo->query('SELECT id, nombre FROM categorias ORDER BY id ASC')->fetchAll();
        $categorias = array_map(fn($f) => ['id' => (int)$f['id'], 'nombre' => $f['nombre']], $filas);
    } else {
        $categorias = [
            ['id' => 1, 'nombre' => 'Cafés'],
            ['id' => 2, 'nombre' => 'Bebidas frías'],
            ['id' => 3, 'nombre' => 'Postres'],
            ['id' => 4, 'nombre' => 'Alimentos'],
        ];
    }
    responderJson(['ok' => true, 'categorias' => $categorias]);
}

if ($metodo === 'GET' || $accion === 'listar') {
    if ($pdo) {
        $filas = $pdo->query('SELECT id, nombre, descripcion, precio, existencias, categoria_id FROM productos ORDER BY id ASC')->fetchAll();
        $productos = array_map(fn($f) => [
            'id'          => (int)$f['id'],
            'nombre'      => $f['nombre'],
            'descripcion' => $f['descripcion'] ?? '',
            'precio'      => (float)$f['precio'],
            'existencias' => (int)$f['existencias'],
            'categoriaId' => (int)$f['categoria_id'],
        ], $filas);
    } else {
        $productos = array_values($_SESSION['productos_respaldo']);
    }
    responderJson(['ok' => true, 'productos' => $productos]);
}

if ($accion === 'guardar' || $metodo === 'POST') {
    $id          = isset($datos['id']) && $datos['id'] !== '' ? (int)$datos['id'] : null;
    $nombre      = trim((string)($datos['nombre'] ?? ''));
    $descripcion = trim((string)($datos['descripcion'] ?? ''));
    $precio      = round((float)($datos['precio'] ?? 0), 2);
    $existencias = max(0, (int)($datos['existencias'] ?? 0));
    $categoriaId = (int)($datos['categoriaId'] ?? 1);

    if ($nombre === '' || $precio <= 0) {
        responderJson(['ok' => false, 'error' => 'Nombre y precio válidos son obligatorios.'], 400);
    }

    if ($pdo) {
        if ($id) {
            $stmt = $pdo->prepare(
                'UPDATE productos SET nombre = :n, descripcion = :d, precio = :p, existencias = :e, categoria_id = :c WHERE id = :id'
            );
            $stmt->execute([
                ':n' => $nombre, ':d' => $descripcion, ':p' => $precio,
                ':e' => $existencias, ':c' => $categoriaId, ':id' => $id,
            ]);
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO productos (nombre, descripcion, precio, existencias, categoria_id) VALUES (:n, :d, :p, :e, :c)'
            );
            $stmt->execute([
                ':n' => $nombre, ':d' => $descripcion, ':p' => $precio,
                ':e' => $existencias, ':c' => $categoriaId,
            ]);
            $id = (int)$pdo->lastInsertId();
        }
    } else {
        if ($id) {
            foreach ($_SESSION['productos_respaldo'] as &$p) {
                if ((int)$p['id'] === $id) {
                    $p = ['id' => $id, 'nombre' => $nombre, 'descripcion' => $descripcion, 'precio' => $precio, 'existencias' => $existencias, 'categoriaId' => $categoriaId];
                    break;
                }
            }
            unset($p);
        } else {
            $maxId = 0;
            foreach ($_SESSION['productos_respaldo'] as $p) {
                $maxId = max($maxId, (int)$p['id']);
            }
            $id = $maxId + 1;
            $_SESSION['productos_respaldo'][] = ['id' => $id, 'nombre' => $nombre, 'descripcion' => $descripcion, 'precio' => $precio, 'existencias' => $existencias, 'categoriaId' => $categoriaId];
        }
    }

    responderJson([
        'ok'       => true,
        'producto' => [
            'id' => $id, 'nombre' => $nombre, 'descripcion' => $descripcion,
            'precio' => $precio, 'existencias' => $existencias, 'categoriaId' => $categoriaId,
        ],
    ]);
}

if ($accion === 'existencias') {
    $id       = (int)($datos['id'] ?? 0);
    $cantidad = max(0, (int)($datos['existencias'] ?? 0));

    if ($pdo) {
        $stmt = $pdo->prepare('UPDATE productos SET existencias = :e WHERE id = :id');
        $stmt->execute([':e' => $cantidad, ':id' => $id]);
    } else {
        foreach ($_SESSION['productos_respaldo'] as &$p) {
            if ((int)$p['id'] === $id) {
                $p['existencias'] = $cantidad;
                break;
            }
        }
        unset($p);
    }

    responderJson(['ok' => true, 'id' => $id, 'existencias' => $cantidad]);
}

if ($accion === 'eliminar' || $metodo === 'DELETE') {
    $id = (int)($datos['id'] ?? ($_GET['id'] ?? 0));
    if ($pdo) {
        $stmt = $pdo->prepare('DELETE FROM productos WHERE id = :id');
        $stmt->execute([':id' => $id]);
    } else {
        $_SESSION['productos_respaldo'] = array_values(array_filter(
            $_SESSION['productos_respaldo'],
            fn($p) => (int)$p['id'] !== $id
        ));
    }
    responderJson(['ok' => true]);
}

responderJson(['ok' => false, 'error' => 'Acción no reconocida.'], 400);
