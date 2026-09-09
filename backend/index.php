<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$origin = env_value('APP_ORIGIN', '');
if ($origin) header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

authorize_request();
$method = $_SERVER['REQUEST_METHOD'];
$path = trim((string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$segments = explode('/', $path); $customerId = null; $productId = null;
$customerPosition = array_search('customers', $segments, true);
$productPosition = array_search('catalog', $segments, true);
if ($customerPosition !== false) $customerId = $segments[$customerPosition + 1] ?? null;
if ($productPosition !== false) $productId = $segments[$productPosition + 1] ?? null;
if ($customerPosition === false && $productPosition === false) json_response(['name' => 'QuoteSwift API', 'version' => 'v4']);

try {
    $pdo = database();
    if ($productPosition !== false) handle_catalog($pdo, $method, $productId);
    if ($method === 'GET' && !$customerId) {
        $query = trim($_GET['q'] ?? '');
        if ($query) { $stmt = $pdo->prepare('SELECT * FROM customers WHERE name LIKE :q OR business_name LIKE :q OR phone LIKE :q ORDER BY updated_at DESC'); $stmt->execute(['q' => "%{$query}%"]); }
        else $stmt = $pdo->query('SELECT * FROM customers ORDER BY updated_at DESC');
        json_response(['data' => $stmt->fetchAll()]);
    }
    if ($method === 'POST' && !$customerId) {
        $body = request_body(); validate_customer($body);
        $id = 'CUS-' . strtoupper(bin2hex(random_bytes(6)));
        $stmt = $pdo->prepare('INSERT INTO customers (id,name,business_name,phone,email,gstin,address,city,state,postal_code,notes) VALUES (:id,:name,:business_name,:phone,:email,:gstin,:address,:city,:state,:postal_code,:notes)');
        $stmt->execute(customer_params($body, $id)); json_response(['data' => ['id' => $id], 'message' => 'Customer created.'], 201);
    }
    if ($method === 'PUT' && $customerId) {
        $body = request_body(); validate_customer($body);
        $stmt = $pdo->prepare('UPDATE customers SET name=:name,business_name=:business_name,phone=:phone,email=:email,gstin=:gstin,address=:address,city=:city,state=:state,postal_code=:postal_code,notes=:notes WHERE id=:id');
        $stmt->execute(customer_params($body, $customerId)); json_response(['message' => 'Customer updated.']);
    }
    if ($method === 'DELETE' && $customerId) {
        $stmt = $pdo->prepare('DELETE FROM customers WHERE id = :id'); $stmt->execute(['id' => $customerId]); json_response(['message' => 'Customer deleted.']);
    }
    json_response(['message' => 'Route not found.'], 404);
} catch (PDOException $error) { error_log($error->getMessage()); json_response(['message' => 'Database request failed.'], 500); }
  catch (Throwable $error) { error_log($error->getMessage()); json_response(['message' => 'Server request failed.'], 500); }

function validate_customer(array $body): void {
    $errors = [];
    if (strlen(trim((string)($body['name'] ?? ''))) < 2) $errors['name'] = 'Name is required.';
    if (!preg_match('/^[6-9]\d{9}$/', (string)($body['phone'] ?? ''))) $errors['phone'] = 'Valid mobile number is required.';
    if (!empty($body['email']) && !filter_var($body['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Email is invalid.';
    if ($errors) json_response(['message' => 'Validation failed.', 'errors' => $errors], 422);
}

function customer_params(array $body, string $id): array {
    return ['id'=>$id,'name'=>trim((string)$body['name'],'business_name'=>trim((string)($body['businessName']??'')),'phone'=>(string)$body['phone'],'email'=>trim((string)($body['email']??'')),'gstin'=>strtoupper(trim((string)($body['gstin']??''))),'address'=>trim((string)($body['address']??'')),'city'=>trim((string)($body['city']??'')),'state'=>trim((string)($body['state']??'')),'postal_code'=>(string)($body['postalCode']??''),'notes'=>trim((string)($body['notes']??''))];
}

function handle_catalog(PDO $pdo, string $method, ?string $itemId): never {
    if ($method === 'GET' && !$itemId) {
        $query = trim($_GET['q'] ?? ''); $type = trim($_GET['type'] ?? '');
        $sql = 'SELECT * FROM catalog_items WHERE 1=1'; $params = [];
        if ($query !== '') { $sql .= ' AND (name LIKE :q OR code LIKE :q OR hsn_sac LIKE :q)'; $params['q'] = "%{$query}%"; }
        if (in_array($type, ['product', 'service'], true)) { $sql .= ' AND type = :type'; $params['type'] = $type; }
        $sql .= ' ORDER BY updated_at DESC'; $stmt = $pdo->prepare($sql); $stmt->execute($params); json_response(['data' => $stmt->fetchAll()]);
    }
    if ($method === 'POST' && !$itemId) {
        $body = request_body(); validate_catalog_item($body); $id = 'ITM-' . strtoupper(bin2hex(random_bytes(6)));
        $stmt = $pdo->prepare('INSERT INTO catalog_items (id,type,name,code,description,unit,rate,tax_rate,hsn_sac,active) VALUES (:id,:type,:name,:code,:description,:unit,:rate,:tax_rate,:hsn_sac,:active)');
        $stmt->execute(catalog_params($body, $id)); json_response(['data' => ['id' => $id], 'message' => 'Item created.'], 201);
    }
    if ($method === 'PUT' && $itemId) {
        $body = request_body(); validate_catalog_item($body);
        $stmt = $pdo->prepare('UPDATE catalog_items SET type=:type,name=:name,code=:code,description=:description,unit=:unit,rate=:rate,tax_rate=:tax_rate,hsn_sac=:hsn_sac,active=:active WHERE id=:id');
        $stmt->execute(catalog_params($body, $itemId)); json_response(['message' => 'Item updated.']);
    }
    if ($method === 'DELETE' && $itemId) {
        $stmt = $pdo->prepare('DELETE FROM catalog_items WHERE id=:id'); $stmt->execute(['id' => $itemId]); json_response(['message' => 'Item deleted.']);
    }
    json_response(['message' => 'Catalogue route not found.'], 404);
}

function validate_catalog_item(array $body): void {
    $errors = [];
    if (!in_array($body['type'] ?? '', ['product', 'service'], true)) $errors['type'] = 'Type must be product or service.';
    if (strlen(trim((string)($body['name'] ?? ''))) < 2) $errors['name'] = 'Name is required.';
    if (!is_numeric($body['rate'] ?? null) || (float)$body['rate'] < 0) $errors['rate'] = 'Rate must be zero or greater.';
    if (!is_numeric($body['taxRate'] ?? null) || (float)$body['taxRate'] < 0 || (float)$body['taxRate'] > 100) $errors['taxRate'] = 'Tax rate is invalid.';
    if ($errors) json_response(['message' => 'Validation failed.', 'errors' => $errors], 422);
}

function catalog_params(array $body, string $id): array {
    return ['id'=>$id,'type'=>$body['type'],'name'=>trim((string)$body['name'],'code'=>strtoupper(trim((string)($body['code']??''))),'description'=>trim((string)($body['description']??'')),'unit'=>trim((string)($body['unit']??'piece')),'rate'=>(float)$body['rate'],'tax_rate'=>(float)$body['taxRate'],'hsn_sac'=>strtoupper(trim((string)($body['hsnSac']??''))),'active'=>!empty($body['active'])?1:0];
}
