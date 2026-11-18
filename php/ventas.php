<?php
/* ==========================================================
   php/ventas.php - Scripts del servidor para consultar ventas
   y registrar una nueva venta descontando existencias y
   limpiando el carrito de la sesión ($_SESSION['carrito']).
   ========================================================== */

require_once __DIR__ . '/conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$datos  = $metodo === 'GET' ? $_GET : leerDatosEntrada();
$pdo    = obtenerConexion();

if ($metodo === 'GET') {
    if ($pdo) {
        $filasVentas = $pdo->query('SELECT id, fecha, usuario_id, metodo_pago, subtotal, descuento, total FROM ventas ORDER BY id ASC')->fetchAll();
        $stmtDetalle = $pdo->prepare('SELECT producto_id, nombre_producto, nota, cantidad, precio_unitario FROM detalle_ventas WHERE venta_id = :vid');
        $ventas = [];

        foreach ($filasVentas as $v) {
            $stmtDetalle->execute([':vid' => $v['id']]);
            $detalles = array_map(fn($d) => [
                'productoId'     => (int)$d['producto_id'],
                'nombre'         => $d['nombre_producto'],
                'nota'           => $d['nota'] ?? '',
                'cantidad'       => (int)$d['cantidad'],
                'precioUnitario' => (float)$d['precio_unitario'],
            ], $stmtDetalle->fetchAll());

            $ventas[] = [
                'id'         => (int)$v['id'],
                'fecha'      => date('c', strtotime($v['fecha'])),
                'usuarioId'  => $v['usuario_id'] !== null ? (int)$v['usuario_id'] : null,
                'metodoPago' => $v['metodo_pago'],
                'subtotal'   => (float)$v['subtotal'],
                'descuento'  => (float)$v['descuento'],
                'total'      => (float)$v['total'],
                'detalle'    => $detalles,
            ];
        }
        responderJson(['ok' => true, 'ventas' => $ventas]);
    }

    responderJson(['ok' => true, 'ventas' => $_SESSION['ventas_respaldo'] ?? []]);
}

if ($metodo === 'POST') {
    $detalle = $datos['detalle'] ?? ($_SESSION['carrito'] ?? []);
    if (!is_array($detalle) || count($detalle) === 0) {
        responderJson(['ok' => false, 'error' => 'El carrito está vacío.'], 400);
    }

    $usuarioSesion = $_SESSION['usuario'] ?? null;
    $usuarioId     = $datos['usuarioId'] ?? ($usuarioSesion['id'] ?? null);
    $metodoPago    = $datos['metodoPago'] ?? 'Efectivo';
    $subtotal      = round((float)($datos['subtotal'] ?? 0), 2);
    $descuento     = round((float)($datos['descuento'] ?? 0), 2);
    $total         = round((float)($datos['total'] ?? 0), 2);
    $fechaIso      = $datos['fecha'] ?? date('c');

    if ($pdo) {
        $pdo->beginTransaction();
        try {
            $stmtVenta = $pdo->prepare(
                'INSERT INTO ventas (fecha, usuario_id, metodo_pago, subtotal, descuento, total)
                 VALUES (NOW(), :uid, :metodo, :sub, :desc, :tot)'
            );
            $stmtVenta->execute([
                ':uid'    => $usuarioId ?: null,
                ':metodo' => $metodoPago,
                ':sub'    => $subtotal,
                ':desc'   => $descuento,
                ':tot'    => $total,
            ]);
            $ventaId = (int)$pdo->lastInsertId();

            $stmtDet = $pdo->prepare(
                'INSERT INTO detalle_ventas (venta_id, producto_id, nombre_producto, nota, cantidad, precio_unitario)
                 VALUES (:vid, :pid, :nom, :nota, :cant, :precio)'
            );
            $stmtStock = $pdo->prepare(
                'UPDATE productos SET existencias = GREATEST(0, existencias - :cant) WHERE id = :pid'
            );

            foreach ($detalle as $item) {
                $stmtDet->execute([
                    ':vid'    => $ventaId,
                    ':pid'    => (int)$item['productoId'],
                    ':nom'    => (string)$item['nombre'],
                    ':nota'   => (string)($item['nota'] ?? ''),
                    ':cant'   => (int)$item['cantidad'],
                    ':precio' => (float)$item['precioUnitario'],
                ]);
                $stmtStock->execute([
                    ':cant' => (int)$item['cantidad'],
                    ':pid'  => (int)$item['productoId'],
                ]);
            }

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            responderJson(['ok' => false, 'error' => 'Error al registrar la venta en BD.'], 500);
        }
    } else {
        if (!isset($_SESSION['ventas_respaldo'])) {
            $_SESSION['ventas_respaldo'] = [];
        }
        $ventaId = count($_SESSION['ventas_respaldo']) + 1;
        $_SESSION['ventas_respaldo'][] = [
            'id' => $ventaId, 'fecha' => $fechaIso, 'usuarioId' => $usuarioId,
            'metodoPago' => $metodoPago, 'subtotal' => $subtotal,
            'descuento' => $descuento, 'total' => $total, 'detalle' => $detalle,
        ];
    }

    // Vaciar el carrito en la sesión del servidor tras cobrar la venta
    $_SESSION['carrito'] = [];

    responderJson([
        'ok'    => true,
        'venta' => [
            'id' => $ventaId, 'fecha' => $fechaIso, 'usuarioId' => $usuarioId,
            'metodoPago' => $metodoPago, 'subtotal' => $subtotal,
            'descuento' => $descuento, 'total' => $total, 'detalle' => $detalle,
        ],
    ]);
}

responderJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
