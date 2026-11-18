<?php
require_once __DIR__ . '/conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$accion = $_GET['accion'] ?? '';

if ($metodo === 'GET') {
    responderJson([
        'ok'      => true,
        'sesion'  => $_SESSION['usuario'] ?? null,
        'carrito' => array_values($_SESSION['carrito'] ?? []),
    ]);
}

if ($metodo === 'POST') {
    $datos = leerDatosEntrada();
    $accion = $datos['accion'] ?? $accion;

    if ($accion === 'cerrar') {
        unset($_SESSION['usuario']);
        responderJson(['ok' => true, 'sesion' => null]);
    }

    $correo = trim((string)($datos['correo'] ?? ''));
    $contrasena = (string)($datos['contrasena'] ?? '');

    if ($correo === '') {
        responderJson(['ok' => false, 'error' => 'Escribe el correo electrónico.'], 400);
    }

    $pdo = obtenerConexion();
    $usuarioEncontrado = null;

    if ($pdo) {
        $stmt = $pdo->prepare('SELECT id, nombre, correo, contrasena, rol FROM usuarios WHERE LOWER(correo) = LOWER(:correo) LIMIT 1');
        $stmt->execute([':correo' => $correo]);
        $fila = $stmt->fetch();
        if ($fila) {
            $usuarioEncontrado = [
                'id'     => (int)$fila['id'],
                'nombre' => $fila['nombre'],
                'correo' => $fila['correo'],
                'rol'    => $fila['rol'],
            ];
        }
    } else {
        foreach ($_SESSION['usuarios_respaldo'] as $u) {
            if (strtolower($u['correo']) === strtolower($correo)) {
                $usuarioEncontrado = $u;
                break;
            }
        }
    }

    // Si el correo no está en la tabla de ejemplo, extrae un nombre legible del correo
    $nombreDefault = ucfirst( explode('@', $correo)[0] ?: $correo );
    $sesion = $usuarioEncontrado ?: [
        'id'     => null,
        'nombre' => $nombreDefault,
        'correo' => $correo,
        'rol'    => 'Cajero',
    ];

    $_SESSION['usuario'] = $sesion;

    responderJson([
        'ok'     => true,
        'sesion' => $sesion,
    ]);
}

if ($metodo === 'DELETE') {
    unset($_SESSION['usuario']);
    responderJson(['ok' => true, 'sesion' => null]);
}

responderJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
