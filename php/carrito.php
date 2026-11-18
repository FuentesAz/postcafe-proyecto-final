<?php
/* ==========================================================
   php/carrito.php - Carrito de compras en sesión ($_SESSION['carrito']).
   Cumple con el Paso 1 (Imagen 1):
   1. Añadir productos al carrito
   2. Modificar productos (cantidad, nombre, precio unitario o nota)
   3. Eliminar productos del carrito (individual o vaciar)
   4. Listar productos almacenados en el carrito durante la navegación
   5. Mostrar al usuario activo desde $_SESSION['usuario']
   ========================================================== */

require_once __DIR__ . '/conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$datos  = $metodo === 'GET' ? $_GET : leerDatosEntrada();
$accion = $datos['accion'] ?? ($_GET['accion'] ?? ($metodo === 'GET' ? 'listar' : ''));

function resumenCarritoActual(): array {
    $items = array_values($_SESSION['carrito'] ?? []);
    $subtotal = 0.0;
    $totalUnidades = 0;

    foreach ($items as $item) {
        $subtotal += ((float)$item['precioUnitario']) * ((int)$item['cantidad']);
        $totalUnidades += (int)$item['cantidad'];
    }

    return [
        'ok'            => true,
        'carrito'       => $items,
        'totalUnidades' => $totalUnidades,
        'subtotal'      => round($subtotal, 2),
        'usuario'       => $_SESSION['usuario'] ?? null,
    ];
}

// 1. LISTAR PRODUCTOS DEL CARRITO
if ($metodo === 'GET' || $accion === 'listar') {
    responderJson(resumenCarritoActual());
}

// 2. AÑADIR PRODUCTOS AL CARRITO
if ($accion === 'agregar') {
    $productoId     = (int)($datos['productoId'] ?? 0);
    $nombre         = trim((string)($datos['nombre'] ?? ''));
    $precioUnitario = round((float)($datos['precioUnitario'] ?? 0), 2);
    $cantidad       = max(1, (int)($datos['cantidad'] ?? 1));
    $nota           = trim((string)($datos['nota'] ?? ''));

    if ($productoId <= 0 || $nombre === '' || $precioUnitario <= 0) {
        responderJson(['ok' => false, 'error' => 'Datos de producto inválidos para agregar al carrito.'], 400);
    }

    $encontrado = false;
    foreach ($_SESSION['carrito'] as &$item) {
        if ((int)$item['productoId'] === $productoId) {
            $item['cantidad'] += $cantidad;
            if ($nota !== '') {
                $item['nota'] = $nota;
            }
            $encontrado = true;
            break;
        }
    }
    unset($item);

    if (!$encontrado) {
        $_SESSION['carrito'][] = [
            'productoId'     => $productoId,
            'nombre'         => $nombre,
            'precioUnitario' => $precioUnitario,
            'cantidad'       => $cantidad,
            'nota'           => $nota,
        ];
    }

    responderJson(resumenCarritoActual());
}

// 3. MODIFICAR PRODUCTOS EN EL CARRITO (cantidad e información)
if ($accion === 'modificar' || $metodo === 'PUT') {
    $productoId = (int)($datos['productoId'] ?? 0);
    if ($productoId <= 0) {
        responderJson(['ok' => false, 'error' => 'ID de producto inválido.'], 400);
    }

    foreach ($_SESSION['carrito'] as $indice => &$item) {
        if ((int)$item['productoId'] === $productoId) {
            if (isset($datos['cantidad'])) {
                $nuevaCantidad = (int)$datos['cantidad'];
                if ($nuevaCantidad <= 0) {
                    array_splice($_SESSION['carrito'], $indice, 1);
                    unset($item);
                    responderJson(resumenCarritoActual());
                }
                $item['cantidad'] = $nuevaCantidad;
            }
            if (isset($datos['nombre']) && trim((string)$datos['nombre']) !== '') {
                $item['nombre'] = trim((string)$datos['nombre']);
            }
            if (isset($datos['precioUnitario']) && (float)$datos['precioUnitario'] > 0) {
                $item['precioUnitario'] = round((float)$datos['precioUnitario'], 2);
            }
            if (array_key_exists('nota', $datos)) {
                $item['nota'] = trim((string)$datos['nota']);
            }
            break;
        }
    }
    unset($item);

    responderJson(resumenCarritoActual());
}

// 4. ELIMINAR UN PRODUCTO O VACIAR EL CARRITO
if ($accion === 'eliminar' || $accion === 'vaciar' || $metodo === 'DELETE') {
    if ($accion === 'vaciar') {
        $_SESSION['carrito'] = [];
        responderJson(resumenCarritoActual());
    }

    $productoId = (int)($datos['productoId'] ?? ($_GET['productoId'] ?? 0));
    $_SESSION['carrito'] = array_values(array_filter(
        $_SESSION['carrito'],
        fn($item) => (int)$item['productoId'] !== $productoId
    ));

    responderJson(resumenCarritoActual());
}

// 5. SINCRONIZAR CARRITO COMPLETO
if ($accion === 'sincronizar' && isset($datos['carrito']) && is_array($datos['carrito'])) {
    $limpio = [];
    foreach ($datos['carrito'] as $i) {
        if (!empty($i['productoId']) && !empty($i['nombre']) && (int)($i['cantidad'] ?? 0) > 0) {
            $limpio[] = [
                'productoId'     => (int)$i['productoId'],
                'nombre'         => trim((string)$i['nombre']),
                'precioUnitario' => round((float)($i['precioUnitario'] ?? 0), 2),
                'cantidad'       => (int)$i['cantidad'],
                'nota'           => trim((string)($i['nota'] ?? '')),
            ];
        }
    }
    $_SESSION['carrito'] = $limpio;
    responderJson(resumenCarritoActual());
}

responderJson(['ok' => false, 'error' => 'Acción no reconocida en el carrito.'], 400);
