<?php
/* ==========================================================
   php/usuarios.php - Scripts del servidor para consultar y
   registrar usuarios con contraseña cifrada en MySQL.
   ========================================================== */

require_once __DIR__ . '/conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$datos  = $metodo === 'GET' ? $_GET : leerDatosEntrada();
$pdo    = obtenerConexion();

if ($metodo === 'GET') {
    if ($pdo) {
        $filas = $pdo->query('SELECT id, nombre, correo, rol FROM usuarios ORDER BY id ASC')->fetchAll();
        $usuarios = array_map(fn($f) => [
            'id'     => (int)$f['id'],
            'nombre' => $f['nombre'],
            'correo' => $f['correo'],
            'rol'    => $f['rol'],
        ], $filas);
    } else {
        $usuarios = array_values($_SESSION['usuarios_respaldo']);
    }
    responderJson(['ok' => true, 'usuarios' => $usuarios]);
}

if ($metodo === 'POST') {
    $nombre     = trim((string)($datos['nombre'] ?? ''));
    $correo     = trim((string)($datos['correo'] ?? ''));
    $contrasena = (string)($datos['contrasena'] ?? '');
    $rol        = in_array($datos['rol'] ?? '', ['Administrador', 'Cajero'], true) ? $datos['rol'] : 'Cajero';

    if ($nombre === '' || $correo === '') {
        responderJson(['ok' => false, 'error' => 'Nombre y correo son obligatorios.'], 400);
    }

    $hash = password_hash($contrasena !== '' ? $contrasena : 'cafe1234', PASSWORD_DEFAULT);

    if ($pdo) {
        $stmt = $pdo->prepare('INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (:n, :c, :p, :r)');
        $stmt->execute([':n' => $nombre, ':c' => $correo, ':p' => $hash, ':r' => $rol]);
        $id = (int)$pdo->lastInsertId();
    } else {
        $maxId = 0;
        foreach ($_SESSION['usuarios_respaldo'] as $u) {
            $maxId = max($maxId, (int)$u['id']);
        }
        $id = $maxId + 1;
        $_SESSION['usuarios_respaldo'][] = ['id' => $id, 'nombre' => $nombre, 'correo' => $correo, 'rol' => $rol];
    }

    responderJson([
        'ok'      => true,
        'usuario' => ['id' => $id, 'nombre' => $nombre, 'correo' => $correo, 'rol' => $rol],
    ]);
}

responderJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
