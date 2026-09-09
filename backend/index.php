<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$origin = env_value('APP_ORIGIN', '');
if ($origin) header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

authorize_request();
$method = $_SERVER['REQUEST_METHOD'];
$path = trim((string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$segments = explode('/', $path); $customerId = null; $productId = null; $quotationId = null;
$customerPosition = array_search('customers', $segments, true);
$productPosition = array_search('catalog', $segments, true);
$quotationPosition = array_search('quotations', $segments, true);
if ($customerPosition !== false) $customerId = $segments[$customerPosition + 1] ?? null;
if ($productPosition !== false) $productId = $segments[$productPosition + 1] ?? null;
if ($quotationPosition !== false) $quotationId = $segments[$quotationPosition + 1] ?? null;
if ($customerPosition === false && $productPosition === false && $quotationPosition === false) json_response(['name' => 'QuoteSwift API', 'version' => 'v5']);

try {
    $pdo = database();
    if ($productPosition !== false) handle_catalog($pdo, $method, $productId);
    if ($quotationPosition !== false) handle_quotations($pdo, $method, $quotationId);
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

function handle_quotations(PDO $pdo, string $method, ?string $quotationId): never {
    if ($method === 'GET' && !$quotationId) {
        $stmt = $pdo->query('SELECT * FROM quotations ORDER BY updated_at DESC'); json_response(['data' => $stmt->fetchAll()]);
    }
    if ($method === 'GET' && $quotationId) {
        $stmt = $pdo->prepare('SELECT * FROM quotations WHERE id=:id'); $stmt->execute(['id'=>$quotationId]); $quote=$stmt->fetch();
        if (!$quote) json_response(['message'=>'Quotation not found.'],404);
        $items=$pdo->prepare('SELECT * FROM quotation_items WHERE quotation_id=:id ORDER BY line_order');$items->execute(['id'=>$quotationId]);$quote['items']=$items->fetchAll();json_response(['data'=>$quote]);
    }
    if ($method === 'PATCH' && $quotationId) {
        $body=request_body();$status=$body['status']??'';
        if(!in_array($status,['Draft','Sent','Accepted','Rejected'],true))json_response(['message'=>'Invalid quotation status.'],422);
        $stmt=$pdo->prepare('UPDATE quotations SET status=:status WHERE id=:id');$stmt->execute(['status'=>$status,'id'=>$quotationId]);
        if($stmt->rowCount()===0)json_response(['message'=>'Quotation not found or unchanged.'],404);
        json_response(['message'=>'Quotation status updated.']);
    }
    if (in_array($method, ['POST','PUT'], true)) {
        $body=request_body();validate_quotation($body);$id=$quotationId?:'QUO-'.strtoupper(bin2hex(random_bytes(6)));$number=$body['number']??next_quotation_number($pdo);
        $pdo->beginTransaction();
        try {
            if ($method==='POST') {
                $stmt=$pdo->prepare('INSERT INTO quotations (id,number,customer_id,customer_name,customer_business,issue_date,valid_until,status,discount_rate,subtotal,discount_amount,taxable_amount,tax_amount,grand_total,notes,terms) VALUES (:id,:number,:customer_id,:customer_name,:customer_business,:issue_date,:valid_until,:status,:discount_rate,:subtotal,:discount_amount,:taxable_amount,:tax_amount,:grand_total,:notes,:terms)');
            } else {
                $stmt=$pdo->prepare('UPDATE quotations SET customer_id=:customer_id,customer_name=:customer_name,customer_business=:customer_business,issue_date=:issue_date,valid_until=:valid_until,status=:status,discount_rate=:discount_rate,subtotal=:subtotal,discount_amount=:discount_amount,taxable_amount=:taxable_amount,tax_amount=:tax_amount,grand_total=:grand_total,notes=:notes,terms=:terms WHERE id=:id');
            }
            $params=quotation_params($body,$id,$number);if($method==='PUT')unset($params['number']);$stmt->execute($params);
            $pdo->prepare('DELETE FROM quotation_items WHERE quotation_id=:id')->execute(['id'=>$id]);
            $line=$pdo->prepare('INSERT INTO quotation_items (id,quotation_id,line_order,catalog_item_id,name,description,quantity,unit,rate,tax_rate,amount,tax_amount,total) VALUES (:id,:quotation_id,:line_order,:catalog_item_id,:name,:description,:quantity,:unit,:rate,:tax_rate,:amount,:tax_amount,:total)');
            foreach($body['items'] as $index=>$item){$line->execute(['id'=>'LIN-'.strtoupper(bin2hex(random_bytes(6))),'quotation_id'=>$id,'line_order'=>$index+1,'catalog_item_id'=>$item['catalogItemId']??null,'name'=>$item['name'],'description'=>$item['description']??'','quantity'=>(float)$item['quantity'],'unit'=>$item['unit']??'piece','rate'=>(float)$item['rate'],'tax_rate'=>(float)$item['taxRate'],'amount'=>(float)$item['amount'],'tax_amount'=>(float)$item['taxAmount'],'total'=>(float)$item['total']]);}
            $pdo->commit();json_response(['data'=>['id'=>$id,'number'=>$number],'message'=>$method==='POST'?'Quotation created.':'Quotation updated.'],$method==='POST'?201:200);
        } catch(Throwable $error){$pdo->rollBack();throw $error;}
    }
    if ($method==='DELETE'&&$quotationId){$stmt=$pdo->prepare('DELETE FROM quotations WHERE id=:id');$stmt->execute(['id'=>$quotationId]);json_response(['message'=>'Quotation deleted.']);}
    json_response(['message'=>'Quotation route not found.'],404);
}

function validate_quotation(array $body): void {
    $errors=[];if(empty($body['customerId']))$errors['customerId']='Customer is required.';if(empty($body['items'])||!is_array($body['items']))$errors['items']='At least one item is required.';
    foreach(($body['items']??[]) as $index=>$item){if(empty($item['name']))$errors["items.{$index}.name"]='Item name is required.';if(!is_numeric($item['quantity']??null)||(float)$item['quantity']<=0)$errors["items.{$index}.quantity"]='Quantity must be greater than zero.';}
    if($errors)json_response(['message'=>'Validation failed.','errors'=>$errors],422);
}

function quotation_params(array $body,string $id,string $number):array{return['id'=>$id,'number'=>$number,'customer_id'=>$body['customerId'],'customer_name'=>$body['customerName']??'','customer_business'=>$body['customerBusiness']??'','issue_date'=>$body['issueDate'],'valid_until'=>$body['validUntil'],'status'=>$body['status']??'Draft','discount_rate'=>(float)($body['discountRate']??0),'subtotal'=>(float)$body['subtotal'],'discount_amount'=>(float)$body['discountAmount'],'taxable_amount'=>(float)$body['taxableAmount'],'tax_amount'=>(float)$body['taxAmount'],'grand_total'=>(float)$body['grandTotal'],'notes'=>$body['notes']??'','terms'=>$body['terms']??''];}
function next_quotation_number(PDO $pdo):string{$year=date('Y');$stmt=$pdo->prepare('SELECT number FROM quotations WHERE number LIKE :prefix ORDER BY number DESC LIMIT 1 FOR UPDATE');$stmt->execute(['prefix'=>"QT-{$year}-%"]);$last=$stmt->fetchColumn();$next=$last?(int)substr((string)$last,-3)+1:1;return sprintf('QT-%s-%03d',$year,$next);}
