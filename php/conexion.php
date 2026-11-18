<?php
/* ==========================================================
   php/conexion.php - Configuración de sesión y conexión PDO
   a la base de datos MySQL (poscafe) en el servidor local.
   ========================================================== */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

$DB_HOST = getenv('POSCAFE_DB_HOST') ?: '127.0.0.1';
$DB_NAME = getenv('POSCAFE_DB_NAME') ?: 'poscafe';
$DB_USER = getenv('POSCAFE_DB_USER') ?: 'root';
$DB_PASS = getenv('POSCAFE_DB_PASS') ?: '';

/**
 * Devuelve una instancia PDO conectada a MySQL, o null si
 * el servicio MySQL aún no está activo (permitiendo respaldo en $_SESSION).
 */
function obtenerConexion(): ?PDO {
    static $pdo = false;
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;

    if ($pdo !== false) {
        return $pdo;
    }

    try {
        $dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";
        $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        $pdo = null;
        return null;
    }
}

/**
 * Inicializa las estructuras en $_SESSION para el carrito y datos de respaldo.
 */
function inicializarSesion(): void {
    if (!isset($_SESSION['carrito']) || !is_array($_SESSION['carrito'])) {
        $_SESSION['carrito'] = [];
    }
    if (!isset($_SESSION['productos_respaldo'])) {
        $_SESSION['productos_respaldo'] = [
            ['id' => 1,  'nombre' => 'Espresso',              'descripcion' => 'Shot sencillo de café de la casa',       'precio' => 35.0, 'existencias' => 40, 'categoriaId' => 1],
            ['id' => 2,  'nombre' => 'Americano',             'descripcion' => 'Espresso con agua caliente',             'precio' => 40.0, 'existencias' => 40, 'categoriaId' => 1],
            ['id' => 3,  'nombre' => 'Capuchino',             'descripcion' => 'Espresso con leche y espuma',            'precio' => 55.0, 'existencias' => 30, 'categoriaId' => 1],
            ['id' => 4,  'nombre' => 'Latte',                 'descripcion' => 'Espresso con abundante leche vaporizada','precio' => 58.0, 'existencias' => 30, 'categoriaId' => 1],
            ['id' => 5,  'nombre' => 'Frappé de moka',        'descripcion' => 'Café frío con chocolate y hielo',        'precio' => 68.0, 'existencias' => 20, 'categoriaId' => 2],
            ['id' => 6,  'nombre' => 'Té helado de limón',    'descripcion' => 'Té negro con limón y hielo',             'precio' => 45.0, 'existencias' => 25, 'categoriaId' => 2],
            ['id' => 7,  'nombre' => 'Limonada mineral',      'descripcion' => 'Limón natural con agua mineral',         'precio' => 42.0, 'existencias' => 25, 'categoriaId' => 2],
            ['id' => 8,  'nombre' => 'Pastel de zanahoria',   'descripcion' => 'Rebanada con betún de queso crema',      'precio' => 60.0, 'existencias' => 6,  'categoriaId' => 3],
            ['id' => 9,  'nombre' => 'Galleta de avena',      'descripcion' => 'Galleta artesanal con pasas',            'precio' => 28.0, 'existencias' => 35, 'categoriaId' => 3],
            ['id' => 10, 'nombre' => 'Sándwich de pavo',      'descripcion' => 'Pan de masa madre, pavo y queso',        'precio' => 85.0, 'existencias' => 12, 'categoriaId' => 4],
            ['id' => 11, 'nombre' => 'Bagel con queso crema', 'descripcion' => 'Bagel tostado con queso crema',          'precio' => 65.0, 'existencias' => 14, 'categoriaId' => 4],
            ['id' => 12, 'nombre' => 'Croissant',             'descripcion' => 'Croissant de mantequilla',               'precio' => 38.0, 'existencias' => 18, 'categoriaId' => 4],
        ];
    }
    if (!isset($_SESSION['usuarios_respaldo'])) {
        $_SESSION['usuarios_respaldo'] = [
            ['id' => 1, 'nombre' => 'Administrador de ejemplo', 'correo' => 'admin@poscafe.mx',  'rol' => 'Administrador'],
            ['id' => 2, 'nombre' => 'Cajero de ejemplo',        'correo' => 'cajero@poscafe.mx', 'rol' => 'Cajero'],
        ];
    }
}

inicializarSesion();

/**
 * Lee el cuerpo JSON o los datos enviados por POST.
 */
function leerDatosEntrada(): array {
    $contenido = file_get_contents('php://input');
    if ($contenido) {
        $decodificado = json_decode($contenido, true);
        if (is_array($decodificado)) {
            return $decodificado;
        }
    }
    return $_POST ?: [];
}

/**
 * Envía una respuesta JSON y termina la ejecución del script.
 */
function responderJson(array $datos, int $codigo = 200): void {
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}
