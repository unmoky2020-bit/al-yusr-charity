#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Al-Yusr API — extras (13 Nov 2026)
#    • a picture for each donation package (السهم / الباقة):
#        GET /package-images · PUT|DELETE /admin/package-images/{package}
#    • editable site blocks (organisation data, About milestones, header / footer links):
#        GET /site-blocks · PUT|DELETE /admin/site-blocks/{key}
#  New tables only (package_images, site_blocks). The packages table is only read.
#  Migrations: ONLY this bundle's file is run (--path), never anyone else's pending ones.
#  New routes: routes/api-2026-11-13-extras.php (one require line appended to routes/api.php)
#  bash deploy.sh --check   → checks only        bash deploy.sh → deploy (backup first, auto-rollback)
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail

APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
API_URL="${API_URL:-https://api.elyusr.org/api/v1}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/files"
STAMP="$(date +%Y%m%d-%H%M%S)"
BK="$HOME/backups/extras-2026-11-13-$STAMP"
CHECK_ONLY=0; [[ "${1:-}" == "--check" ]] && CHECK_ONLY=1
FORCE="${FORCE:-0}"
REQUIRE_LINE="require __DIR__.'/api-2026-11-13-extras.php';"
MIGRATIONS=(
  database/migrations/2026_11_13_000001_create_package_images_and_site_blocks.php
)

green() { printf '\033[32m%s\033[0m\n' "$*"; }
red()   { printf '\033[31m%s\033[0m\n' "$*"; }
step()  { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

# ── 1. Checks ────────────────────────────────────────────────────────────────
step "1/6 فحص قبل أي تعديل"
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
  fi
done < "$HERE/expected-base.sha256"

for need in app/Support/StaffAccess.php routes/api.php; do
  [[ -f "$APP/$need" ]] || { red "  ناقص على السيرفر (البندل محتاجه): $need"; PROBLEMS=$((PROBLEMS+1)); }
done

# The packages table we read (never write).
HAS_PKG=$(php artisan tinker --execute="echo Illuminate\Support\Facades\Schema::hasTable('program_donation_packages') ? 'yes' : 'no';" 2>/dev/null | tail -1 | tr -d '\r\n ')
[[ "$HAS_PKG" == "yes" ]] || { red "  جدول program_donation_packages مش موجود"; PROBLEMS=$((PROBLEMS+1)); }
for t in package_images site_blocks; do
  EX=$(php artisan tinker --execute="echo Illuminate\Support\Facades\Schema::hasTable('$t') ? 'yes' : 'no';" 2>/dev/null | tail -1 | tr -d '\r\n ')
  [[ "$EX" == "yes" ]] && echo "  تنبيه: جدول $t موجود بالفعل (الـ migration هتعدّيه)"
done

if (( PROBLEMS > 0 )); then
  red "في $PROBLEMS مشكلة فوق. مش هكمّل عشان ما نمسحش شغل حد."
  red "لو متأكد إن الاستبدال آمن شغّل:  FORCE=1 bash deploy.sh"
  [[ "$FORCE" == "1" ]] || exit 1
  red "FORCE=1 — هكمّل (فيه نسخة احتياطية قبل أي تعديل)."
fi

envval() { { grep -E "^$1=" "$APP/.env" || true; } | tail -1 | cut -d= -f2- | sed -e 's/\r$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"; }
DB_CONNECTION="$(envval DB_CONNECTION)"; DB_HOST="$(envval DB_HOST)"; DB_PORT="$(envval DB_PORT)"
DB_DATABASE="$(envval DB_DATABASE)"; DB_USERNAME="$(envval DB_USERNAME)"; DB_PASSWORD="$(envval DB_PASSWORD)"
[[ "$DB_CONNECTION" == "mysql" || "$DB_CONNECTION" == "mariadb" ]] || { red "قاعدة البيانات مش MySQL ($DB_CONNECTION) — الباك أب لازم يتعمل يدوي"; exit 1; }
command -v mysqldump >/dev/null || { red "mysqldump مش موجود"; exit 1; }
php artisan migrate:status --no-ansi >/dev/null || { red "migrate:status فشل — اتأكد من الاتصال بقاعدة البيانات"; exit 1; }
PENDING_OTHERS="$(php artisan migrate:status --no-ansi | grep -i pending | grep -v '2026_11_13_000001' || true)"
if [[ -n "$PENDING_OTHERS" ]]; then
  echo "  تنبيه: في migrations تانية مستنية (مش بتاعتنا — مش هتتشغل):"
  echo "$PENDING_OTHERS" | sed 's/^/    /'
fi
green "الفحص تمام."
(( CHECK_ONLY )) && { green "(--check) مفيش أي تعديل اتعمل."; exit 0; }

# ── 2. Backup ────────────────────────────────────────────────────────────────
step "2/6 نسخة احتياطية → $BK"
mkdir -p "$BK"
tar -czf "$BK/code.tgz" -C "$APP" app routes database
export MYSQL_PWD="$DB_PASSWORD"
mysqldump --single-transaction --quick --routines --no-tablespaces \
  -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" "$DB_DATABASE" | gzip > "$BK/db.sql.gz"
unset MYSQL_PWD
cat > "$BK/rollback.sh" <<RB
#!/usr/bin/env bash
# يرجّع الكود زي ما كان قبل نشر $STAMP ويشيل الجدولين الجداد (مفيش جدول قديم اتلمس).
set -e
cd "$APP"
php artisan migrate:rollback --path=${MIGRATIONS[0]} --force --no-ansi || true
tar -xzf "$BK/code.tgz" -C "$APP"
rm -f "$APP/routes/api-2026-11-13-extras.php" "$APP/${MIGRATIONS[0]}"
rm -rf "$APP/app/Http/Controllers/Api/V1/Extras" "$APP/app/Models/Extras"
php artisan optimize:clear
echo "الكود رجع. (لو محتاج قاعدة البيانات كاملة: zcat $BK/db.sql.gz | mysql ...)"
RB
chmod +x "$BK/rollback.sh"
green "اتاخدت: code.tgz + db.sql.gz ($(du -h "$BK/db.sql.gz" | cut -f1)) + rollback.sh"

restore() {
  red "حصل خطأ — برجّع الكود من النسخة الاحتياطية…"
  bash "$BK/rollback.sh" || true
  red "رجع. ابعت آخر 40 سطر من الشاشة دي."
}
trap restore ERR

# ── 3. Files ─────────────────────────────────────────────────────────────────
step "3/6 نسخ الملفات"
awk '{print $2}' "$HERE/expected-base.sha256" | while read -r f; do
  [[ -z "$f" ]] && continue
  mkdir -p "$APP/$(dirname "$f")"
  cp "$SRC/$f" "$APP/$f"
  php -l "$APP/$f" >/dev/null
  echo "  ✓ $f"
done
if ! grep -qF "$REQUIRE_LINE" "$APP/routes/api.php"; then
  printf '\n%s\n' "$REQUIRE_LINE" >> "$APP/routes/api.php"
  echo "  ✓ routes/api.php ← $REQUIRE_LINE"
fi
php -l "$APP/routes/api.php" >/dev/null

# ── 4. Our migration only ───────────────────────────────────────────────────
step "4/6 قاعدة البيانات (الـ migration بتاع البندل ده بس)"
for m in "${MIGRATIONS[@]}"; do
  php artisan migrate --path="$m" --force --no-ansi | sed 's/^/  /'
done

# ── 5. Caches ───────────────────────────────────────────────────────────────
step "5/6 تنظيف الكاش"
php artisan optimize:clear --no-ansi >/dev/null
php artisan route:list --path=api/v1/package-images --no-ansi | sed 's/^/  /'
php artisan route:list --path=api/v1/site-blocks --no-ansi | sed 's/^/  /'
trap - ERR

# ── 6. Smoke tests ───────────────────────────────────────────────────────────
step "6/6 تجربة"
ok=1
code() { curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' "$@"; }
c=$(code "$API_URL/programs");                               echo "  GET programs → $c (200)"; [[ $c == 200 ]] || ok=0
c=$(code "$API_URL/package-images");                         echo "  GET package-images → $c (200)"; [[ $c == 200 ]] || ok=0
c=$(code "$API_URL/site-blocks");                            echo "  GET site-blocks → $c (200)"; [[ $c == 200 ]] || ok=0
c=$(code -X PUT "$API_URL/admin/package-images/1");          echo "  PUT admin/package-images/1 بدون دخول → $c (401)"; [[ $c == 401 ]] || ok=0
c=$(code -X DELETE "$API_URL/admin/package-images/1");       echo "  DELETE admin/package-images/1 بدون دخول → $c (401)"; [[ $c == 401 ]] || ok=0
c=$(code -X PUT "$API_URL/admin/site-blocks/org_info");      echo "  PUT admin/site-blocks/org_info بدون دخول → $c (401)"; [[ $c == 401 ]] || ok=0
APP="$APP" php "$HERE/selftest.php" || ok=0
echo
if (( ok )); then green "✅ النشر خلص. النسخة الاحتياطية: $BK"; else red "⚠️  في تجربة مش زي المتوقع (فوق). للرجوع: bash $BK/rollback.sh"; fi
