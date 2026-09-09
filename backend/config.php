<?php
declare(strict_types=1);

function load_environment(string $path): void {
    if (!is_file($path)) return;
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$key, $value] = array_map('trim', explode('=', $line, 2));
        $value = trim($value, "\"'");
        if ($key !== '' && getenv($key) === false) putenv("{$key}={$value}");
    }
}

load_environment(__DIR__ . '/.env');

function env_value(string $key, ?string $default = null): ?string {
    $value = getenv($key);
    return $value === false ? $default : $value;
}

function database(): PDO {
    static $pdo;
    if ($pdo instanceof PDO) return $pdo;
    $host = env_value('DB_HOST'); $port = env_value('DB_PORT', '3306');
    $database = env_value('DB_DATABASE'); $username = env_value('DB_USERNAME');
    $password = env_value('DB_PASSWORD');
    if (!$host || !$database || !$username || !$password) throw new RuntimeException('Database configuration is incomplete.');
    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
    return $pdo;
}

function json_response(array $data, int $status = 200): never {
    http_response_code($status); header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES); exit;
}

function request_body(): array {
    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body)) json_response(['message' => 'Invalid JSON body.'], 400);
    return $body;
}

function authorize_request(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        $tokenHash = hash('sha256', trim($matches[1]));
        $stmt = database()->prepare('SELECT account_id FROM api_sessions WHERE token_hash = :token_hash AND expires_at > NOW() LIMIT 1');
        $stmt->execute(['token_hash' => $tokenHash]);
        $accountId = $stmt->fetchColumn();
        if (!$accountId) json_response(['message' => 'Session expired or invalid.'], 401);
        database()->prepare('UPDATE api_sessions SET last_used_at = NOW() WHERE token_hash = :token_hash')->execute(['token_hash' => $tokenHash]);
        return (string) $accountId;
    }
    $expected = env_value('API_KEY');
    $provided = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if (!$expected || !hash_equals($expected, $provided)) json_response(['message' => 'Unauthorized.'], 401);
    return null;
}
