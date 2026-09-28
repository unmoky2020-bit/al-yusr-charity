<?php
/**
 * اليسر — Lightweight PHP API (نفس contract الـ Node API)
 * نشره على Shared Hosting أو نستخدمه كنواة لـ Laravel.
 * متطلبات: PHP 8.1+ + ext-pdo_mysql (أو ext-mongodb).
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ($_ENV['APP_CORS_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

function env(string $k, $d = null) { return $_ENV[$k] ?? getenv($k) ?: $d; }
function jin(): array { return json_decode(file_get_contents('php://input') ?: '[]', true) ?: []; }
function ok($data, int $c = 200) { http_response_code($c); echo json_encode(['data' => $data], JSON_UNESCAPED_UNICODE); exit; }
function fail(int $c, string $m) { http_response_code($c); echo json_encode(['error' => $m], JSON_UNESCAPED_UNICODE); exit; }

/* ========= DB ========= */
function pdo(): PDO {
  static $p = null;
  if ($p) return $p;
  $p = new PDO(
    sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
      env('MYSQL_HOST','127.0.0.1'), env('MYSQL_PORT','3306'), env('MYSQL_DB','alyusr')),
    env('MYSQL_USER','root'), env('MYSQL_PASSWORD',''),
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
  return $p;
}
function uuid(): string {
  $d = random_bytes(16);
  $d[6] = chr(ord($d[6]) & 0x0f | 0x40); $d[8] = chr(ord($d[8]) & 0x3f | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
}

/* ========= Auth (JWT-lite HS256) ========= */
function jwt_sign(array $payload): string {
  $h = rtrim(strtr(base64_encode(json_encode(['alg'=>'HS256','typ'=>'JWT'])), '+/', '-_'), '=');
  $p = rtrim(strtr(base64_encode(json_encode($payload + ['exp' => time()+86400*7])), '+/', '-_'), '=');
  $s = rtrim(strtr(base64_encode(hash_hmac('sha256', "$h.$p", env('JWT_SECRET','dev'), true)), '+/', '-_'), '=');
  return "$h.$p.$s";
}
function jwt_verify(?string $tok): ?array {
  if (!$tok) return null;
  $parts = explode('.', $tok); if (count($parts) !== 3) return null;
  [$h,$p,$s] = $parts;
  $check = rtrim(strtr(base64_encode(hash_hmac('sha256', "$h.$p", env('JWT_SECRET','dev'), true)), '+/', '-_'), '=');
  if (!hash_equals($check, $s)) return null;
  $payload = json_decode(base64_decode(strtr($p, '-_', '+/')), true);
  return ($payload && ($payload['exp'] ?? 0) > time()) ? $payload : null;
}
function current_user(): ?array {
  $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  $t = str_starts_with($h, 'Bearer ') ? substr($h, 7) : null;
  return jwt_verify($t);
}
function has_role(string $uid, array $roles): bool {
  $in = implode(',', array_fill(0, count($roles), '?'));
  $st = pdo()->prepare("SELECT 1 FROM user_roles WHERE user_id=? AND role IN ($in) LIMIT 1");
  $st->execute(array_merge([$uid], $roles));
  return (bool)$st->fetch();
}
function require_role(array $roles): array {
  $u = current_user(); if (!$u) fail(401,'unauthorized');
  if (!has_role($u['sub'], $roles)) fail(403,'forbidden');
  return $u;
}

/* ========= Router ========= */
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^/index\.php#', '', $path);
$method = $_SERVER['REQUEST_METHOD'];

try {
  // Health
  if ($method==='GET' && $path==='/health') ok(['ok'=>true,'driver'=>'mysql','runtime'=>'php']);

  // Auth
  if ($method==='POST' && $path==='/api/auth/register') {
    $b = jin(); if (empty($b['email'])||empty($b['password'])) fail(400,'email/password required');
    $id = uuid(); $hash = password_hash($b['password'], PASSWORD_BCRYPT);
    pdo()->prepare('INSERT INTO users (id,email,password_hash,full_name,phone,city) VALUES (?,?,?,?,?,?)')
      ->execute([$id, $b['email'], $hash, $b['name']??'', $b['phone']??null, $b['city']??null]);
    pdo()->prepare('INSERT INTO user_roles (id,user_id,role) VALUES (?,?,?)')
      ->execute([uuid(), $id, $b['role'] ?? 'donor']);
    ok(['user'=>['id'=>$id,'email'=>$b['email'],'name'=>$b['name']??''], 'token'=>jwt_sign(['sub'=>$id,'email'=>$b['email']])]);
  }
  if ($method==='POST' && $path==='/api/auth/login') {
    $b = jin();
    $st = pdo()->prepare('SELECT * FROM users WHERE email=? LIMIT 1'); $st->execute([$b['email']??'']);
    $u = $st->fetch();
    if (!$u || !password_verify($b['password']??'', $u['password_hash'])) fail(401,'invalid credentials');
    ok(['user'=>['id'=>$u['id'],'email'=>$u['email'],'name'=>$u['full_name']], 'token'=>jwt_sign(['sub'=>$u['id'],'email'=>$u['email']])]);
  }

  // Categories
  if ($method==='GET' && $path==='/api/categories') {
    ok(pdo()->query('SELECT * FROM case_categories WHERE active=1 ORDER BY sort_order')->fetchAll());
  }

  // Cases public list
  if ($method==='GET' && $path==='/api/cases') {
    $cat = $_GET['cat'] ?? null;
    $q = "SELECT c.*, cat.slug AS cat_slug, cat.name_ar AS cat_name_ar, cat.name_en AS cat_name_en, cat.icon AS cat_icon
          FROM cases c JOIN case_categories cat ON cat.id=c.category_id
          WHERE c.status IN ('approved','funded','closed')";
    $params = [];
    if ($cat) { $q .= ' AND cat.slug=?'; $params[] = $cat; }
    $q .= ' ORDER BY c.created_at DESC';
    $st = pdo()->prepare($q); $st->execute($params);
    $rows = array_map(function($r){
      $r['case_categories'] = ['slug'=>$r['cat_slug'],'name_ar'=>$r['cat_name_ar'],'name_en'=>$r['cat_name_en'],'icon'=>$r['cat_icon']];
      unset($r['cat_slug'],$r['cat_name_ar'],$r['cat_name_en'],$r['cat_icon']); return $r;
    }, $st->fetchAll());
    ok($rows);
  }

  // Case detail by ref
  if ($method==='GET' && preg_match('#^/api/cases/([^/]+)$#', $path, $m)) {
    $st = pdo()->prepare("SELECT c.*, cat.slug AS cat_slug, cat.name_ar AS cat_name_ar, cat.name_en AS cat_name_en, cat.icon AS cat_icon
                          FROM cases c JOIN case_categories cat ON cat.id=c.category_id WHERE c.ref_code=? LIMIT 1");
    $st->execute([$m[1]]); $r = $st->fetch(); if (!$r) fail(404,'not found');
    $r['case_categories'] = ['slug'=>$r['cat_slug'],'name_ar'=>$r['cat_name_ar'],'name_en'=>$r['cat_name_en'],'icon'=>$r['cat_icon']];
    unset($r['cat_slug'],$r['cat_name_ar'],$r['cat_name_en'],$r['cat_icon']); ok($r);
  }

  // Create case
  if ($method==='POST' && $path==='/api/cases') {
    $u = require_role(['admin','case_manager']); $b = jin();
    $id = uuid(); $ref = 'C-'.date('Y').'-'.str_pad((string)random_int(0,99999),5,'0',STR_PAD_LEFT);
    pdo()->prepare("INSERT INTO cases (id,ref_code,category_id,title,story,beneficiary_name,beneficiary_age,governorate,city,cover_image_url,needed_amount,deadline,urgency,status,created_by)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?)")
      ->execute([$id,$ref,$b['category_id'],$b['title'],$b['story']??'',$b['beneficiary_name'],$b['beneficiary_age']??null,
                 $b['governorate']??'الدقهلية',$b['city']??null,$b['cover_image_url']??null,$b['needed_amount']??0,
                 $b['deadline']??null,$b['urgency']??'medium',$u['sub']]);
    ok(['id'=>$id,'ref_code'=>$ref]);
  }

  // Status transition
  if ($method==='PATCH' && preg_match('#^/api/cases/([^/]+)/status$#', $path, $m)) {
    $u = require_role(['admin','case_manager']); $b = jin();
    $set = ['status=?']; $vals = [$b['status']];
    if ($b['status']==='approved') { $set[]='approved_by=?'; $set[]='approved_at=NOW()'; $vals[]=$u['sub']; }
    if ($b['status']==='closed')   { $set[]='closed_at=NOW()'; }
    if ($b['status']==='rejected') { $set[]='rejection_reason=?'; $vals[]=$b['reason']??null; }
    $vals[]=$m[1];
    pdo()->prepare('UPDATE cases SET '.implode(',', array_filter($set, fn($s)=>!str_contains($s,'NOW()'))).
                   (str_contains(implode(',',$set),'NOW()') ? ', '.implode(',', array_filter($set, fn($s)=>str_contains($s,'NOW()'))) : '').
                   ' WHERE id=?')->execute($vals);
    ok(['ok'=>true]);
  }

  // Delete case
  if ($method==='DELETE' && preg_match('#^/api/cases/([^/]+)$#', $path, $m)) {
    require_role(['admin']);
    pdo()->prepare('DELETE FROM cases WHERE id=?')->execute([$m[1]]); ok(['ok'=>true]);
  }

  // Updates
  if ($method==='GET' && preg_match('#^/api/cases/([^/]+)/updates$#', $path, $m)) {
    $st = pdo()->prepare('SELECT * FROM case_updates WHERE case_id=? ORDER BY created_at DESC');
    $st->execute([$m[1]]); ok($st->fetchAll());
  }
  if ($method==='POST' && preg_match('#^/api/cases/([^/]+)/updates$#', $path, $m)) {
    $u = require_role(['admin','case_manager']); $b = jin();
    $id = uuid();
    pdo()->prepare('INSERT INTO case_updates (id,case_id,body,image_url,author_id) VALUES (?,?,?,?,?)')
      ->execute([$id, $m[1], $b['body'], $b['image_url']??null, $u['sub']]);
    ok(['id'=>$id]);
  }

  // Donations
  if ($method==='GET' && $path==='/api/donations/me') {
    $u = current_user(); if (!$u) fail(401,'unauthorized');
    $st = pdo()->prepare('SELECT * FROM donations WHERE donor_id=? ORDER BY created_at DESC');
    $st->execute([$u['sub']]); ok($st->fetchAll());
  }
  if ($method==='POST' && $path==='/api/donations') {
    $u = current_user(); $b = jin();
    $id = uuid(); $ref = 'D-'.date('ymd').'-'.str_pad((string)random_int(0,99999),5,'0',STR_PAD_LEFT);
    pdo()->prepare("INSERT INTO donations (id,ref_code,donor_id,case_id,amount,donor_name,donor_email,donor_phone,payment_method,payment_status,message)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?)")
      ->execute([$id,$ref,$u['sub']??null,$b['case_id']??null,$b['amount'],$b['donor_name']??null,$b['donor_email']??null,$b['donor_phone']??null,$b['payment_method']??null,$b['payment_status']??'pending',$b['message']??null]);
    ok(['id'=>$id,'ref_code'=>$ref]);
  }

  fail(404, 'route not found: '.$method.' '.$path);
} catch (Throwable $e) {
  fail(500, $e->getMessage());
}