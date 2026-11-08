#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Al-Yusr API — 8 Nov 2026: donor notifications, program slugs, accounts and editor access
#    • the donor's own account is notified when a donation is confirmed (paid) or fails, and
#      when an update is posted on a case they paid for (in-app + web push, like the admins)
#    • program slugs: a pasted page address is cleaned to its last part; only a-z 0-9 and "-"
#    • forgotten password by a 6-digit email code: POST /forgot-password, POST /reset-password
#    • email confirmation by code: POST /email/verification-code, POST /email/verify
#    • sign in with Google / Facebook: GET /auth/providers, POST /auth/google, POST /auth/facebook
#      (stays off until GOOGLE_CLIENT_ID / FACEBOOK_APP_ID + FACEBOOK_APP_SECRET are in .env)
#    • GET /me/access: the dashboard menu follows the account's role permissions
#    • the super admin sets a user's password: PUT /users/{user}/password
#    • the Editor role becomes blog-only (old list saved; KEEP_EDITOR=1 skips this step) and the
#      add-on role «محرر حالات» (case-editor) is created for editors who may add cases
#  No migration, no table. New routes: routes/api-2026-11-08.php
#  bash deploy.sh --check   → checks only        bash deploy.sh → deploy (backup first, auto-rollback)
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail

APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
API_URL="${API_URL:-https://api.elyusr.org/api/v1}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/files"
STAMP="$(date +%Y%m%d-%H%M%S)"
BK="$HOME/backups/2026-11-08-$STAMP"
CHECK_ONLY=0; [[ "${1:-}" == "--check" ]] && CHECK_ONLY=1
FORCE="${FORCE:-0}"
REQUIRE_LINE="require __DIR__.'/api-2026-11-08.php';"

green() { printf '\033[32m%s\033[0m\n' "$*"; }
red()   { printf '\033[31m%s\033[0m\n' "$*"; }
step()  { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

# ── 1. Checks ────────────────────────────────────────────────────────────────
step "1/5 فحص قبل أي تعديل"
[[ -f "$APP/artisan" ]] || { red "مش لاقي Laravel في $APP (غيّر المسار: APP=/path bash deploy.sh)"; exit 1; }
command -v php >/dev/null || { red "php مش موجود"; exit 1; }
cd "$APP"
php artisan --version

PROBLEMS=0
while read -r expected path; do
  [[ -z "$path" ]] && continue
  if [[ "$expected" == "NEW" ]]; then
    if [[ -f "$APP/$path" ]] && ! cmp -s "$APP/$path" "$SRC/$path"; then
      red "  موجود بالفعل ومختلف: $path"; PROBLEMS=$((PROBLEMS+1))
    fi
  else
    if [[ ! -f "$APP/$path" ]]; then
      red "  ناقص على السيرفر: $path"; PROBLEMS=$((PROBLEMS+1))
    elif cmp -s "$APP/$path" "$SRC/$path"; then
      :  # already deployed
    else
      actual="$(sha256sum < "$APP/$path" | cut -d' ' -f1)"
      if [[ "|$expected|" != *"|$actual|"* ]]; then
        red "  اتعدّل على السيرفر (مش النسخة اللي التعديل مبني عليها): $path"; PROBLEMS=$((PROBLEMS+1))
      fi
    fi
  fi
done < "$HERE/expected-base.sha256"

if (( PROBLEMS > 0 )); then
  red "في $PROBLEMS ملف على السيرفر مش زي النسخة اللي التعديلات مبنية عليها."
  red "مش هكتب فوقهم عشان ما نمسحش شغل حد. ابعت الملفات دي للمطور يدمجها،"
  red "أو لو متأكد إن الاستبدال آمن شغّل:  FORCE=1 bash deploy.sh"
  [[ "$FORCE" == "1" ]] || exit 1
  red "FORCE=1 — هكمّل (فيه نسخة احتياطية قبل أي تعديل)."
fi

# DB credentials from .env (values may be quoted)
envval() { { grep -E "^$1=" "$APP/.env" || true; } | tail -1 | cut -d= -f2- | sed -e 's/\r$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"; }
DB_CONNECTION="$(envval DB_CONNECTION)"; DB_HOST="$(envval DB_HOST)"; DB_PORT="$(envval DB_PORT)"
DB_DATABASE="$(envval DB_DATABASE)"; DB_USERNAME="$(envval DB_USERNAME)"; DB_PASSWORD="$(envval DB_PASSWORD)"
[[ "$DB_CONNECTION" == "mysql" || "$DB_CONNECTION" == "mariadb" ]] || { red "قاعدة البيانات مش MySQL ($DB_CONNECTION) — الباك أب لازم يتعمل يدوي"; exit 1; }
command -v mysqldump >/dev/null || { red "mysqldump مش موجود"; exit 1; }
php artisan migrate:status --no-ansi >/dev/null || { red "migrate:status فشل — اتأكد من الاتصال بقاعدة البيانات"; exit 1; }
php artisan tinker --execute="echo '  إرسال البريد (MAIL_MAILER): '.config('mail.default').' — لو log أو array، رموز كلمة السر مش هتوصل لحد'.PHP_EOL;" || true
php artisan tinker --execute="echo '  الكاش (CACHE_STORE): '.config('cache.default').PHP_EOL;" || true
php artisan tinker --execute="\$p = collect(Schema::getColumns('users'))->firstWhere('name', 'phone'); echo '  users.phone: '.(\$p ? (\$p['nullable'] ? 'يقبل فاضي ✓ (التسجيل بجوجل/فيسبوك من غير رقم)' : 'مطلوب ✗ — التسجيل بجوجل/فيسبوك محتاج العمود يقبل فاضي') : 'مش موجود').PHP_EOL;" || true
MW="$APP/app/Http/Middleware/EditorApprovalMiddleware.php"
if [[ -f "$MW" ]]; then
  echo "  مراجعة تعديلات المحرر (EditorApprovalMiddleware) — السطور اللي بتحدد مين بيتراجع وإيه الرد:"
  grep -nE "slug|hasRole|role|status|return response|202|_approval_execution" "$MW" | head -14 | sed 's/^/    /' || true
else
  red "  مش لاقي EditorApprovalMiddleware.php — تعديلات المحرر مش هتتحجز للمراجعة"
fi
green "الفحص تمام."
(( CHECK_ONLY )) && { green "(--check) مفيش أي تعديل اتعمل."; exit 0; }

# ── 2. Backup ────────────────────────────────────────────────────────────────
step "2/5 نسخة احتياطية → $BK"
mkdir -p "$BK"
tar -czf "$BK/code.tgz" -C "$APP" app routes database bootstrap config composer.json composer.lock
export MYSQL_PWD="$DB_PASSWORD"
mysqldump --single-transaction --quick --routines --no-tablespaces \
  -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" "$DB_DATABASE" | gzip > "$BK/db.sql.gz"
unset MYSQL_PWD
[[ "$(zcat "$BK/db.sql.gz" | tail -c 200 | grep -c 'Dump completed')" -ge 1 ]] || { red "الباك أب بتاع قاعدة البيانات مش كامل — وقفت."; exit 1; }
php artisan migrate:status --no-ansi > "$BK/migrate-status-before.txt" || true

cat > "$BK/rollback.sh" <<RB
#!/usr/bin/env bash
# يرجّع الكود زي ما كان قبل نشر $STAMP. قاعدة البيانات: شوف آخر الملف.
set -e
cd "$APP"
# صلاحيات المحرر الأول (الأمر اللي بيرجّعها جزء من الكود الجديد)
for f in "$BK"/editor-permissions-before-*.json; do
  [[ -f "\$f" ]] && php artisan yusr:editor-access --restore="\$f" || true
done
tar -xzf "$BK/code.tgz" -C "$APP"
php artisan optimize:clear
echo "الكود رجع."
echo "لو عايز ترجّع قاعدة البيانات كلها (هيمسح أي بيانات اتسجلت بعد النشر):"
echo "  zcat $BK/db.sql.gz | mysql -h ${DB_HOST:-127.0.0.1} -P ${DB_PORT:-3306} -u $DB_USERNAME -p $DB_DATABASE"
RB
chmod +x "$BK/rollback.sh"
green "اتاخدت: code.tgz + db.sql.gz ($(du -h "$BK/db.sql.gz" | cut -f1)) + rollback.sh"

restore() {
  red "حصل خطأ — برجّع الكود من النسخة الاحتياطية…"
  bash "$BK/rollback.sh" || true
  red "رجع. ابعت آخر 40 سطر من الشاشة دي للمطور."
}
trap restore ERR

# ── 3. Files ─────────────────────────────────────────────────────────────────
step "3/5 نسخ الملفات"
# Only the files in the manifest (anything else left in files/ from an older copy is ignored).
awk '{print $2}' "$HERE/expected-base.sha256" | while read -r f; do
  [[ -z "$f" ]] && continue
  mkdir -p "$APP/$(dirname "$f")"
  cp "$SRC/$f" "$APP/$f"
  php -l "$APP/$f" >/dev/null
  echo "  ✓ $f"
done

# ── 4. Caches ───────────────────────────────────────────────────────────────
step "4/5 تنظيف الكاش"
if ! grep -qF "$REQUIRE_LINE" "$APP/routes/api.php"; then
  printf '\n%s\n' "$REQUIRE_LINE" >> "$APP/routes/api.php"
  echo "  ✓ routes/api.php ← $REQUIRE_LINE"
fi
php -l "$APP/routes/api.php" >/dev/null
php artisan optimize:clear --no-ansi >/dev/null
php artisan route:list --path=api/v1/me/access --no-ansi >/dev/null   # the routes file loads

if [[ "${KEEP_EDITOR:-0}" == "1" ]]; then
  echo "  KEEP_EDITOR=1 — صلاحيات المحرر زي ما هي:"; php artisan yusr:editor-access --no-ansi || true
else
  echo "  المحرر ← المدونة بس:"
  php artisan yusr:editor-access --blog-only --backup-dir="$BK" --no-ansi | sed 's/^/    /' \
    || red "  تعديل صلاحيات المحرر ما اتعملش (الباقي اتنشر عادي). جرّبه لوحده: php artisan yusr:editor-access --blog-only"
fi

# ── 5. Smoke tests ───────────────────────────────────────────────────────────
step "5/5 تجربة"
trap - ERR
ok=1
c=$(curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' "$API_URL/programs?per_page=1")
echo "  GET programs → $c (المتوقع 200)"; [[ $c == 200 ]] || ok=0
c=$(curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' -H 'Content-Type: application/json' -d '{"email":"nobody-test@elyusr.org"}' "$API_URL/forgot-password")
echo "  POST forgot-password (إيميل مش مسجّل) → $c (المتوقع 200، ومفيش رسالة بتتبعت)"; [[ $c == 200 ]] || ok=0
c=$(curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' -H 'Content-Type: application/json' -d '{"email":"nobody-test@elyusr.org","code":"000000","password":"x1234567","password_confirmation":"x1234567"}' "$API_URL/reset-password")
echo "  POST reset-password (رمز غلط) → $c (المتوقع 422)"; [[ $c == 422 ]] || ok=0
c=$(curl -s -o /dev/null -w '%{http_code}' -X PUT -H 'Accept: application/json' "$API_URL/users/1/password")
echo "  PUT users/1/password من غير تسجيل دخول → $c (المتوقع 401)"; [[ $c == 401 ]] || ok=0
c=$(curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' "$API_URL/me/access")
echo "  GET me/access من غير تسجيل دخول → $c (المتوقع 401)"; [[ $c == 401 ]] || ok=0
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Accept: application/json' "$API_URL/email/verify")
echo "  POST email/verify من غير تسجيل دخول → $c (المتوقع 401)"; [[ $c == 401 ]] || ok=0
r=$(curl -s -H 'Accept: application/json' "$API_URL/auth/providers")
echo "  GET auth/providers → $r (null = الزرار مستخبي لحد ما المفاتيح تتحط)"; [[ $r == *'"google"'* ]] || ok=0
php artisan tinker --execute="foreach (['App\\Support\\NotifyDonor','App\\Support\\EmailCode','App\\Notifications\\DonorDonationPaidNotification','App\\Notifications\\DonorDonationFailedNotification','App\\Notifications\\DonorCaseUpdateNotification','App\\Observers\\CaseUpdateObserver','App\\Http\\Controllers\\Api\\V1\\Auth\\SocialAuthController','App\\Http\\Controllers\\Api\\V1\\Auth\\AccessController'] as \$c) { echo '  '.(class_exists(\$c) ? '✓' : '✗').' '.\$c.PHP_EOL; }" || ok=0
php artisan tinker --execute="\$k = App\\Support\\EmailCode::issue('selftest', 'selftest@elyusr.org'); echo '  رمز تجريبي في الكاش: '.(App\\Support\\EmailCode::check('selftest', 'selftest@elyusr.org', \$k) ? '✓ اتقبل' : '✗ ما اتقبلش').PHP_EOL;" || ok=0
php artisan tinker --execute="\$d = App\\Models\\Donation::with('donor')->where('status','paid')->latest()->first(); echo '  آخر تبرع مدفوع: '.(\$d ? ('#'.\$d->id.' — حساب المتبرع: '.(App\\Support\\NotifyDonor::accountFor(\$d)?->email ?? 'مفيش حساب (متبرع ضيف)')) : 'مفيش').PHP_EOL;" || true
echo
if (( ok )); then green "✅ النشر خلص. النسخة الاحتياطية: $BK"; else red "⚠️  في تجربة مش زي المتوقع (فوق). للرجوع: bash $BK/rollback.sh"; fi
