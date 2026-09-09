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
$segments = explode('/', $path); $customerId = null; $productId = null; $quotationId = null; $paymentQuotationId = null; $invoiceId = null; $reminderId = null;
$customerPosition = array_search('customers', $segments, true);
$productPosition = array_search('catalog', $segments, true);
$quotationPosition = array_search('quotations', $segments, true);
$paymentPosition = array_search('payments', $segments, true);
$invoicePosition = array_search('invoices', $segments, true);
$reminderPosition = array_search('reminders', $segments, true);
if ($customerPosition !== false) $customerId = $segments[$customerPosition + 1] ?? null;
if ($productPosition !== false) $productId = $segments[$productPosition + 1] ?? null;
if ($quotationPosition !== false) $quotationId = $segments[$quotationPosition + 1] ?? null;
if ($paymentPosition !== false) $paymentQuotationId = $segments[$paymentPosition + 1] ?? null;
if ($invoicePosition !== false) $invoiceId = $segments[$invoicePosition + 1] ?? null;
if ($reminderPosition !== false) $reminderId = $segments[$reminderPosition + 1] ?? null;
if ($customerPosition === false && $productPosition === false && $quotationPosition === false && $paymentPosition === false && $invoicePosition === false && $reminderPosition === false) json_response(['name' => 'QuoteSwift API', 'version' => 'v10']);

try {
    $pdo = database();
    if ($productPosition !== false) handle_catalog($pdo, $method, $productId);
    if ($paymentPosition !== false) handle_payments($pdo, $method, $paymentQuotationId);
    if ($invoicePosition !== false) handle_invoices($pdo, $method, $invoiceId);
    if ($reminderPosition !== false) handle_reminders($pdo, $method, $reminderId);
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

function handle_payments(PDO $pdo, string $method, ?string $quotationId): never {
    if ($method === 'GET' && !$quotationId) {
        $stmt = $pdo->query('SELECT * FROM quotation_payments ORDER BY updated_at DESC');
        json_response(['data' => $stmt->fetchAll()]);
    }
    if ($method === 'GET' && $quotationId) {
        $stmt = $pdo->prepare('SELECT * FROM quotation_payments WHERE quotation_id=:quotation_id');
        $stmt->execute(['quotation_id' => $quotationId]);
        json_response(['data' => $stmt->fetch() ?: ['quotation_id'=>$quotationId,'status'=>'Unpaid','amount_paid'=>0]]);
    }
    if ($method === 'PUT' && $quotationId) {
        $body = request_body();
        if (!is_numeric($body['amountPaid'] ?? null) || (float)$body['amountPaid'] < 0) {
            json_response(['message' => 'Amount paid must be zero or greater.'], 422);
        }
        $total = $pdo->prepare('SELECT grand_total FROM quotations WHERE id=:id');
        $total->execute(['id' => $quotationId]);
        $grandTotal = $total->fetchColumn();
        if ($grandTotal === false) json_response(['message' => 'Quotation not found.'], 404);
        $amount = min((float)$body['amountPaid'], (float)$grandTotal);
        $status = $amount <= 0 ? 'Unpaid' : ($amount >= (float)$grandTotal ? 'Paid' : 'Partial');
        $stmt = $pdo->prepare("INSERT INTO quotation_payments (quotation_id,status,amount_paid,transaction_reference,paid_at) VALUES (:quotation_id,:status,:amount_paid,:transaction_reference,:paid_at) ON DUPLICATE KEY UPDATE status=VALUES(status),amount_paid=VALUES(amount_paid),transaction_reference=VALUES(transaction_reference),paid_at=VALUES(paid_at)");
        $stmt->execute(['quotation_id'=>$quotationId,'status'=>$status,'amount_paid'=>$amount,'transaction_reference'=>trim((string)($body['transactionReference']??'')),'paid_at'=>$amount>0?date('Y-m-d H:i:s'):null]);
        json_response(['data'=>['quotationId'=>$quotationId,'status'=>$status,'amountPaid'=>$amount],'message'=>'Payment updated.']);
    }
    if ($method === 'DELETE' && $quotationId) {
        $stmt = $pdo->prepare('DELETE FROM quotation_payments WHERE quotation_id=:quotation_id');
        $stmt->execute(['quotation_id'=>$quotationId]);
        json_response(['message'=>'Payment reset.']);
    }
    json_response(['message'=>'Payment route not found.'],404);
}

function handle_invoices(PDO $pdo, string $method, ?string $invoiceId): never {
    if ($method === 'GET' && !$invoiceId) {
        $stmt=$pdo->query('SELECT i.*,COALESCE(p.status,\'Unpaid\') payment_status,COALESCE(p.amount_paid,0) amount_paid FROM invoices i LEFT JOIN quotation_payments p ON p.quotation_id=i.quotation_id ORDER BY i.updated_at DESC');
        json_response(['data'=>$stmt->fetchAll()]);
    }
    if ($method === 'GET' && $invoiceId) {
        $stmt=$pdo->prepare('SELECT * FROM invoices WHERE id=:id');$stmt->execute(['id'=>$invoiceId]);$invoice=$stmt->fetch();
        if(!$invoice)json_response(['message'=>'Invoice not found.'],404);
        $items=$pdo->prepare('SELECT * FROM invoice_items WHERE invoice_id=:id ORDER BY line_order');$items->execute(['id'=>$invoiceId]);$invoice['items']=$items->fetchAll();json_response(['data'=>$invoice]);
    }
    if ($method === 'POST' && !$invoiceId) {
        $body=request_body();$quotationId=trim((string)($body['quotationId']??''));
        if($quotationId==='')json_response(['message'=>'Quotation is required.'],422);
        $existing=$pdo->prepare('SELECT id,number FROM invoices WHERE quotation_id=:id');$existing->execute(['id'=>$quotationId]);
        if($invoice=$existing->fetch())json_response(['data'=>$invoice,'message'=>'Invoice already exists.']);
        $quoteStmt=$pdo->prepare('SELECT * FROM quotations WHERE id=:id AND status=\'Accepted\'');$quoteStmt->execute(['id'=>$quotationId]);$quote=$quoteStmt->fetch();
        if(!$quote)json_response(['message'=>'Accepted quotation not found.'],422);
        $items=$pdo->prepare('SELECT * FROM quotation_items WHERE quotation_id=:id ORDER BY line_order');$items->execute(['id'=>$quotationId]);$lines=$items->fetchAll();
        $pdo->beginTransaction();
        try {
            $id='INV-'.strtoupper(bin2hex(random_bytes(6)));$number=next_invoice_number($pdo);$issue=date('Y-m-d');$due=date('Y-m-d',strtotime('+15 days'));
            $stmt=$pdo->prepare('INSERT INTO invoices (id,number,quotation_id,quotation_number,customer_id,customer_name,customer_business,issue_date,due_date,discount_rate,subtotal,discount_amount,taxable_amount,tax_amount,grand_total,notes,terms) VALUES (:id,:number,:quotation_id,:quotation_number,:customer_id,:customer_name,:customer_business,:issue_date,:due_date,:discount_rate,:subtotal,:discount_amount,:taxable_amount,:tax_amount,:grand_total,:notes,:terms)');
            $stmt->execute(['id'=>$id,'number'=>$number,'quotation_id'=>$quotationId,'quotation_number'=>$quote['number'],'customer_id'=>$quote['customer_id'],'customer_name'=>$quote['customer_name'],'customer_business'=>$quote['customer_business'],'issue_date'=>$issue,'due_date'=>$due,'discount_rate'=>$quote['discount_rate'],'subtotal'=>$quote['subtotal'],'discount_amount'=>$quote['discount_amount'],'taxable_amount'=>$quote['taxable_amount'],'tax_amount'=>$quote['tax_amount'],'grand_total'=>$quote['grand_total'],'notes'=>$quote['notes'],'terms'=>$quote['terms']]);
            $line=$pdo->prepare('INSERT INTO invoice_items (id,invoice_id,line_order,catalog_item_id,name,description,quantity,unit,rate,tax_rate,amount,tax_amount,total) VALUES (:id,:invoice_id,:line_order,:catalog_item_id,:name,:description,:quantity,:unit,:rate,:tax_rate,:amount,:tax_amount,:total)');
            foreach($lines as $item){$line->execute(['id'=>'ILI-'.strtoupper(bin2hex(random_bytes(6))),'invoice_id'=>$id,'line_order'=>$item['line_order'],'catalog_item_id'=>$item['catalog_item_id'],'name'=>$item['name'],'description'=>$item['description'],'quantity'=>$item['quantity'],'unit'=>$item['unit'],'rate'=>$item['rate'],'tax_rate'=>$item['tax_rate'],'amount'=>$item['amount'],'tax_amount'=>$item['tax_amount'],'total'=>$item['total']]);}
            $pdo->commit();json_response(['data'=>['id'=>$id,'number'=>$number],'message'=>'Invoice created.'],201);
        } catch(Throwable $error){$pdo->rollBack();throw $error;}
    }
    json_response(['message'=>'Invoice route not found.'],404);
}

function next_invoice_number(PDO $pdo):string{$year=date('Y');$stmt=$pdo->prepare('SELECT number FROM invoices WHERE number LIKE :prefix ORDER BY number DESC LIMIT 1 FOR UPDATE');$stmt->execute(['prefix'=>"INV-{$year}-%"]);$last=$stmt->fetchColumn();$next=$last?(int)substr((string)$last,-3)+1:1;return sprintf('INV-%s-%03d',$year,$next);}

function handle_reminders(PDO $pdo, string $method, ?string $reminderId): never {
    if ($method==='GET') {
        $where=$reminderId?' WHERE id=:id':'';$stmt=$pdo->prepare('SELECT * FROM follow_up_reminders'.$where.' ORDER BY scheduled_at');$stmt->execute($reminderId?['id'=>$reminderId]:[]);json_response(['data'=>$reminderId?$stmt->fetch():$stmt->fetchAll()]);
    }
    if ($method==='POST'&&!$reminderId) {
        $body=request_body();$required=['sourceType','sourceId','documentNumber','customerId','customerName','message','scheduledAt'];foreach($required as $field){if(trim((string)($body[$field]??''))==='')json_response(['message'=>"{$field} is required."],422);}
        if(!in_array($body['sourceType'],['Quotation','Invoice'],true))json_response(['message'=>'Invalid source type.'],422);
        $id='REM-'.strtoupper(bin2hex(random_bytes(6)));$stmt=$pdo->prepare('INSERT INTO follow_up_reminders (id,source_type,source_id,document_number,customer_id,customer_name,customer_phone,amount,message,scheduled_at) VALUES (:id,:source_type,:source_id,:document_number,:customer_id,:customer_name,:customer_phone,:amount,:message,:scheduled_at) ON DUPLICATE KEY UPDATE customer_phone=VALUES(customer_phone),amount=VALUES(amount),message=VALUES(message),scheduled_at=VALUES(scheduled_at)');
        $stmt->execute(['id'=>$id,'source_type'=>$body['sourceType'],'source_id'=>$body['sourceId'],'document_number'=>$body['documentNumber'],'customer_id'=>$body['customerId'],'customer_name'=>$body['customerName'],'customer_phone'=>$body['customerPhone']??'','amount'=>(float)($body['amount']??0),'message'=>$body['message'],'scheduled_at'=>date('Y-m-d H:i:s',strtotime($body['scheduledAt']))]);json_response(['data'=>['id'=>$id],'message'=>'Reminder saved.'],201);
    }
    if ($method==='PATCH'&&$reminderId) {
        $body=request_body();$completed=!empty($body['completed'])?date('Y-m-d H:i:s'):null;$stmt=$pdo->prepare('UPDATE follow_up_reminders SET completed_at=:completed_at WHERE id=:id');$stmt->execute(['completed_at'=>$completed,'id'=>$reminderId]);json_response(['message'=>'Reminder updated.']);
    }
    if ($method==='DELETE'&&$reminderId) {$stmt=$pdo->prepare('DELETE FROM follow_up_reminders WHERE id=:id');$stmt->execute(['id'=>$reminderId]);json_response(['message'=>'Reminder deleted.']);}
    json_response(['message'=>'Reminder route not found.'],404);
}
