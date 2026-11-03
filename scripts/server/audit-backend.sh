#!/usr/bin/env bash
# فحص الباك إند والاستضافة — قراية بس. مبيغيّرش أي ملف ولا أي سجل، ومبيطبعش باسوردات ولا مفاتيح.
#
#   scp -P 65002 scripts/server/audit-backend.sh u389354171@195.35.26.214:~/
#   ssh -p 65002 u389354171@195.35.26.214 'bash ~/audit-backend.sh > ~/audit-$(date +%Y%m%d).txt 2>&1; tail -5 ~/audit-$(date +%Y%m%d).txt'
#   scp -P 65002 u389354171@195.35.26.214:~/audit-*.txt .
#
# The output is meant to be pasted back into the review: it holds counts, versions, flags and route names,
# never .env secrets, tokens, password hashes or donor data.
set -u
API="${API_ROOT:-$HOME/domains/api.elyusr.org/public_html}"
SITE="${SITE_ROOT:-$HOME/domains/elyusr.org/public_html}"
API_URL="https://api.elyusr.org/api/v1"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
sec(){ printf '\n==== %s ====\n' "$1"; }
cd "$API" || { echo "API root not found: $API"; exit 1; }

sec "1. Versions"
php -v | head -1
php artisan --version 2>&1 | head -1
composer --version 2>/dev/null | head -1 || echo "composer: not on PATH"
echo "-- composer audit (production packages)"
(composer audit --no-dev --locked --no-interaction 2>&1 || true) | grep -E -i "found|advisor|severity|package|cve|^\| " | head -25

sec "2. .env (safe keys only; secrets show as set/empty)"
for k in APP_ENV APP_DEBUG APP_URL LOG_LEVEL LOG_CHANNEL QUEUE_CONNECTION CACHE_STORE CACHE_DRIVER SESSION_DRIVER SESSION_SECURE_COOKIE SESSION_DOMAIN SANCTUM_STATEFUL_DOMAINS FILESYSTEM_DISK MAIL_MAILER MAIL_FROM_ADDRESS KASHIER_MODE BROADCAST_CONNECTION; do
  v=$(grep -E "^$k=" .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"\r')
  printf '  %-26s %s\n' "$k" "${v:-<not set>}"
done
for k in APP_KEY DB_PASSWORD MAIL_HOST MAIL_USERNAME MAIL_PASSWORD KASHIER_API_KEY KASHIER_SECRET_KEY KASHIER_MERCHANT_ID VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY PAYMOB_API_KEY; do
  v=$(grep -E "^$k=" .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"\r')
  printf '  %-26s %s\n' "$k" "$([ -n "$v" ] && echo set || echo empty)"
done
grep -c $'\r' .env >/dev/null 2>&1 && echo "  ⚠ .env has Windows line endings (CRLF)" || echo "  .env line endings: LF"
echo "  config cached: $([ -f bootstrap/cache/config.php ] && echo yes || echo no) | routes cached: $(ls bootstrap/cache/routes-*.php >/dev/null 2>&1 && echo yes || echo no)"

sec "3. Backend code under git?"
if [ -d .git ]; then
  git log -1 --format='  last commit: %h %ci %s' 2>/dev/null
  echo "  changed files not committed: $(git status --porcelain 2>/dev/null | grep -v '^??' | wc -l) | untracked: $(git status --porcelain 2>/dev/null | grep -c '^??')"
  git remote -v 2>/dev/null | head -2 | sed 's#//[^@]*@#//***@#'
else echo "  no .git — the code on the server is the only copy"; fi

sec "4. Migrations not run"
php artisan migrate:status 2>&1 | grep -i -E "pending|no\b" | head -20 || true
echo "  total migrations: $(php artisan migrate:status 2>/dev/null | grep -c -E 'Ran|Pending')"

sec "5. Routes"
php artisan route:list --json > "$TMP/routes.json" 2>/dev/null || echo "  route:list failed"
cat > "$TMP/fe.txt" <<'FE'
/about-us
/about-us/:x
/achievements
/activity-logs
/admin/about-us
/admin/about-us/:x
/admin/axes
/admin/axes/:x
/admin/homepage/carousel
/admin/homepage/carousel/items
/admin/homepage/carousel/items/:x
/admin/homepage/carousel/items/:x/toggle
/admin/homepage/carousel/reorder
/admin/homepage/carousel/settings
/articles
/axes
/axes/:x
/blog-seo
/blog-seo/:x
/blog-seo/statistics
/case-categories
/case-documents/:x
/case-media/:x
/case-updates/:x
/cases
/cases/:x
/cases/statistics
/change-password
/contact-messages
/contact-messages/:x
/content
/content-change-requests
/content-change-requests/:x/approve
/content-change-requests/:x/reject
/content/:x
/content/statistics
/dashboard
/donation-campaign-categories
/donation-campaign-categories/:x
/donation-campaigns
/donation-campaigns/:x
/donation-campaigns/:x/donation-packages
/donation-campaigns/by-slug/:x
/donations
/donations/:x/status
/donations/stats
/donations/submit
/donations/track/:x
/donors
/faq-categories
/faqs
/faqs/:x
/gallery
/gallery/statistics
/home-numbers
/home-numbers/:x/move-down
/home-numbers/:x/move-up
/home-statistics
/home-statistics/:x/move-down
/home-statistics/:x/move-up
/homepage/carousel
/homepage/content
/homepage/hero
/homepage/urgent-cases
/khabia-requests
/login
/logout
/media
/media/find
/misbaha-rooms
/misbaha-rooms/:x
/misbaha-rooms/stats
/newsletter
/newsletter-campaigns
/newsletter-campaigns/:x/send
/newsletter-campaigns/:x/send-test
/newsletter/confirm
/newsletter/statistics
/newsletter/subscribe
/newsletter/unsubscribe
/notifications
/notifications/:x
/notifications/:x/read
/notifications/read
/notifications/read-all
/notifications/unread-count
/pages
/payment-gateways
/payment-gateways/:x
/payment-gateways/:x/test
/payment-gateways/:x/toggle
/payment-methods
/payment-methods/:x
/payment-methods/active
/payment-transactions
/payment-transactions/:x/retry
/permissions
/profile
/programs
/programs/:x
/programs/:x/donation-packages
/programs/:x/page-sections
/programs/:x/page-sections/:x
/programs/:x/page-sections/:x/toggle
/programs/:x/top-section
/projects
/projects/:x
/projects/:x/donation-packages
/push/public-key
/push/subscriptions
/register
/reports
/roles
/seasons
/seasons/:x
/service-categories
/services
/services/:x
/services/reorder
/settings
/stories
/stories/:x
/stories/statistics
/users
/volunteer-applications
/volunteer-applications/:x
/volunteer-campaigns
/volunteer-campaigns/:x
/volunteer-campaigns/:x/applications
/volunteer-campaigns/:x/apply
/volunteer-campaigns/statistics
/volunteers
/volunteers/statistics
FE
cat > "$TMP/routes.php" <<'PHP'
<?php
$r = json_decode(file_get_contents($argv[1]), true) ?: [];
$fe = array_filter(array_map('trim', file($argv[2])));
echo "  total routes: " . count($r) . "\n";
$writes = []; $noThrottle = []; $byGroup = [];
foreach ($r as $x) {
  $uri = $x['uri']; $m = $x['method']; $mw = implode(',', (array)($x['middleware'] ?? []));
  if (strpos($uri, 'api/v1/') !== 0) continue;
  $seg = explode('/', substr($uri, 7))[0]; $byGroup[$seg] = ($byGroup[$seg] ?? 0) + 1;
  $isWrite = (bool) preg_match('/POST|PUT|PATCH|DELETE/', $m);
  $auth = stripos($mw, 'auth') !== false;
  if ($isWrite && !$auth) { $writes[] = sprintf('%-12s %s', $m, $uri); if (stripos($mw, 'throttle') === false) $noThrottle[] = "$m $uri"; }
}
echo "  public (no login) write routes: " . count($writes) . "\n"; foreach ($writes as $w) echo "    $w\n";
echo "  … of them without a request limit (throttle): " . count($noThrottle) . "\n"; foreach ($noThrottle as $w) echo "    $w\n";
// frontend paths with no route
$pats = [];
foreach ($r as $x) { $u = $x['uri']; if (strpos($u, 'api/v1/') !== 0) continue; $pats[] = '#^' . preg_replace('#\\\{[^/]+\\\}#', '[^/]+', preg_quote(substr($u, 6), '#')) . '$#'; }
$missing = [];
foreach ($fe as $p) { $t = str_replace(':x', 'X', $p); $ok = false; foreach ($pats as $re) if (preg_match($re, $t)) { $ok = true; break; } if (!$ok) $missing[] = $p; }
echo "  frontend paths with no matching route: " . count($missing) . " of " . count($fe) . "\n"; foreach ($missing as $p) echo "    $p\n";
PHP
[ -s "$TMP/routes.json" ] && php "$TMP/routes.php" "$TMP/routes.json" "$TMP/fe.txt"

sec "6. Data checks (counts only)"
cat > "$TMP/data.php" <<'PHP'
<?php
require getcwd() . '/vendor/autoload.php';
$app = require getcwd() . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Schema;
function q($label, $fn) { try { $v = $fn(); echo sprintf("  %-46s %s\n", $label, is_scalar($v) ? $v : json_encode($v, JSON_UNESCAPED_UNICODE)); } catch (Throwable $e) { echo sprintf("  %-46s ERROR %s\n", $label, substr($e->getMessage(), 0, 120)); } }
q('database driver', fn() => DB::connection()->getDriverName());
foreach (['users','cases','donations','donors','programs','projects','donation_campaigns','contents','blog_seo','stories','media','faqs','newsletter_subscribers','newsletter_campaigns','misbaha_rooms','contact_messages','khabia_requests','volunteers','volunteer_campaign_applications','activity_logs','audit_logs','notifications','push_subscriptions','failed_jobs','jobs','personal_access_tokens','settings','donation_items'] as $t)
  q("rows in $t", fn() => Schema::hasTable($t) ? DB::table($t)->count() : 'table missing');
q('cases titled «[تجريبية]…»', fn() => DB::table('cases')->where('title', 'like', '[تجريبية]%')->count());
q('cases by status', fn() => DB::table('cases')->select('status', DB::raw('count(*) n'))->groupBy('status')->pluck('n', 'status'));
q('donations by status', fn() => DB::table('donations')->select('status', DB::raw('count(*) n'))->groupBy('status')->pluck('n', 'status'));
q('paid total (EGP)', fn() => DB::table('donations')->where('status', 'paid')->sum('amount'));
q('suspected test donations 95,99,105-108,133', fn() => DB::table('donations')->whereIn('id', [95,99,105,106,107,108,133])->pluck('status', 'id'));
q('donations with case_id', fn() => DB::table('donations')->whereNotNull('case_id')->count());
q('demo account admin@alyusr.com exists', fn() => DB::table('users')->where('email', 'admin@alyusr.com')->exists() ? 'YES' : 'no');
q('demo account gomaa@test.com exists', fn() => DB::table('users')->where('email', 'gomaa@test.com')->exists() ? 'YES' : 'no');
q('users with a role', fn() => Schema::hasTable('model_has_roles') ? DB::table('model_has_roles')->join('roles', 'roles.id', '=', 'model_has_roles.role_id')->select('roles.name', DB::raw('count(*) n'))->groupBy('roles.name')->pluck('n', 'name') : 'no spatie tables');
q('API tokens older than 90 days', fn() => DB::table('personal_access_tokens')->where('created_at', '<', now()->subDays(90))->count());
q('projects visible but inactive/hidden', fn() => DB::table('projects')->where(fn($w) => $w->where('is_active', 0))->pluck('slug'));
q('projects has page_content column', fn() => Schema::hasColumn('projects', 'page_content') ? 'yes' : 'NO');
q('projects has hide_from_audience column', fn() => Schema::hasColumn('projects', 'hide_from_audience') ? 'yes' : 'NO');
q('newsletter subscribers by status', fn() => DB::table('newsletter_subscribers')->select('status', DB::raw('count(*) n'))->groupBy('status')->pluck('n', 'status'));
q('contents (articles) by status', fn() => DB::table('contents')->where('type', 'article')->select('status', DB::raw('count(*) n'))->groupBy('status')->pluck('n', 'status'));
q('failed jobs (last 7 days)', fn() => DB::table('failed_jobs')->where('failed_at', '>', now()->subDays(7))->count());
PHP
php "$TMP/data.php" 2>&1 | head -60

sec "7. Payments"
K=$(grep -rl "class KashierController" app 2>/dev/null | head -1)
echo "  KashierController: ${K:-not found}"
if [ -n "$K" ]; then
  echo "  signature check (hash_hmac/hash_equals): $(grep -c -E 'hash_hmac|hash_equals' "$K") line(s)"
  echo "  amount/currency compared before marking paid: $(grep -c -E "amount|currency" "$K") mention(s)"
  grep -n -E "function (webhook|redirect)|hash_hmac|hash_equals|'paid'|\"paid\"|status\s*=>|->update\(" "$K" | head -20
fi
P=$(grep -rl "class PaymobController" app 2>/dev/null | head -1); echo "  PaymobController: ${P:-not found} | route files mentioning paymob: $(grep -l -i paymob routes/*.php 2>/dev/null | wc -l)"

sec "8. Public exposure (expect 403/404 for all)"
for u in "https://api.elyusr.org/.env" "https://api.elyusr.org/storage/logs/laravel.log" "https://api.elyusr.org/composer.json" "https://api.elyusr.org/.git/config" "https://api.elyusr.org/artisan" "https://elyusr.org/.git/config" "https://elyusr.org/.env" "https://elyusr.org/site.zip"; do
  printf '  %-52s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' "$u")"
done
echo "  archives / dumps inside web roots:"
find "$SITE" "$API/public" -maxdepth 3 -type f \( -name '*.sql' -o -name '*.sql.gz' -o -name '*.zip' -o -name '*.tgz' -o -name '*.tar*' -o -name '*.bak' -o -name '.env*' \) 2>/dev/null | sed 's#^#    #' | head -20

sec "9. Security headers"
for u in "https://elyusr.org/" "$API_URL/programs"; do
  echo "  $u"
  curl -sI "$u" | grep -i -E "^(x-powered-by|server|strict-transport-security|content-security-policy|content-security-policy-report-only|x-frame-options|permissions-policy|access-control-allow-origin):" | cut -c1-140 | sed 's/^/    /'
done

sec "10. Scheduler, queue, mail"
crontab -l 2>/dev/null | grep -v '^#' | grep -v '^$' | sed 's/^/  cron: /' || echo "  no crontab"
php artisan schedule:list 2>&1 | head -15 | sed 's/^/  /'

sec "11. Disk, logs, backups"
du -sh "$API/storage/app/public" "$API/storage/app/private" "$API/storage/logs" "$HOME/backups" "$SITE" 2>/dev/null | sed 's/^/  /'
L="$API/storage/logs/laravel.log"
if [ -f "$L" ]; then
  echo "  laravel.log: $(du -h "$L" | cut -f1); errors in last 5000 lines: $(tail -5000 "$L" | grep -c '\.ERROR:')"
  tail -5000 "$L" | grep -o -E '\.ERROR: [A-Za-z\\]*(Exception|Error)[A-Za-z\\]*' | sort | uniq -c | sort -rn | head -8 | sed 's/^/   /'
fi
ls -1t "$HOME/backups" 2>/dev/null | head -12 | sed 's/^/  backup: /'

sec "12. Access"
echo "  SSH keys allowed (names only):"; awk '{print "    " $NF}' "$HOME/.ssh/authorized_keys" 2>/dev/null || echo "    none"
echo "  folders in home:"; ls -1 "$HOME" | sed 's/^/    /' | head -60
echo; echo "تم الفحص. ابعت الملف ده كله."
