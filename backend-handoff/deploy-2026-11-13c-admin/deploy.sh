#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Al-Yusr API — admin extras (13 Nov 2026, c)
#    • record_extras: project AI summary / FAQ (fields the projects table doesn't have)
#    • misbaha admin: edit details, delete for good, bulk delete
#  New table record_extras only; one require line in routes/api.php. Migration run by --path only.
#  bash deploy.sh --check  /  bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
API_URL="${API_URL:-https://api.elyusr.org/api/v1}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; SRC="$HERE/files"
STAMP="$(date +%Y%m%d-%H%M%S)"; BK="$HOME/backups/admin-2026-11-13-$STAMP"
CHECK_ONLY=0; [[ "${1:-}" == "--check" ]] && CHECK_ONLY=1
REQUIRE_LINE="require __DIR__.'/api-2026-11-13c-admin.php';"
MIG=database/migrations/2026_11_13_000002_create_record_extras.php
FILES=(app/Http/Controllers/Api/V1/Extras/SiteBlockController.php app/Http/Controllers/Api/V1/Extras/RecordExtrasController.php app/Http/Controllers/Api/V1/Extras/MisbahaAdminController.php routes/api-2026-11-13c-admin.php "$MIG")
green() { printf '\033[32m%s\033[0m\n' "$*"; }; red() { printf '\033[31m%s\033[0m\n' "$*"; }; step() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

step "1/6 فحص"
cd "$APP"; php artisan --version
P=0
[[ -f app/Support/StaffAccess.php ]] || { red "  ناقص StaffAccess"; P=$((P+1)); }
for t in misbaha_rooms projects; do
  [[ $(php artisan tinker --execute="echo Illuminate\Support\Facades\Schema::hasTable('$t')?'y':'n';" 2>/dev/null | tail -1 | tr -d '\r\n ') == y ]] || { red "  جدول $t مش موجود"; P=$((P+1)); }
done
php artisan route:list --path=api/v1/admin/misbaha-rooms --no-ansi 2>/dev/null | grep -q DELETE && echo "  تنبيه: في DELETE على السبح بالفعل"
(( P > 0 )) && { red "في $P مشكلة."; exit 1; }
envval() { { grep -E "^$1=" .env || true; } | tail -1 | cut -d= -f2- | sed -e 's/\r$//' -e 's/^"//' -e 's/"$//'; }
green "الفحص تمام."; (( CHECK_ONLY )) && { green "(--check) مفيش تعديل."; exit 0; }

step "2/6 نسخة احتياطية → $BK"
mkdir -p "$BK"; cp routes/api.php "$BK/api.php"; cp app/Http/Controllers/Api/V1/Extras/SiteBlockController.php "$BK/SiteBlockController.php"
export MYSQL_PWD="$(envval DB_PASSWORD)"
mysqldump --single-transaction --no-tablespaces -h "$(envval DB_HOST)" -P "$(envval DB_PORT)" -u "$(envval DB_USERNAME)" "$(envval DB_DATABASE)" misbaha_rooms | gzip > "$BK/misbaha_rooms.sql.gz"; unset MYSQL_PWD
cat > "$BK/rollback.sh" <<RB
#!/usr/bin/env bash
cd "$APP"; php artisan migrate:rollback --path=$MIG --force --no-ansi || true
cp "$BK/api.php" routes/api.php
rm -f ${FILES[*]}
cp "$BK/SiteBlockController.php" app/Http/Controllers/Api/V1/Extras/SiteBlockController.php
php artisan optimize:clear; echo "رجع. (السبح المحذوفة: zcat $BK/misbaha_rooms.sql.gz | mysql …)"
RB
chmod +x "$BK/rollback.sh"; trap 'red "خطأ — برجّع"; bash "$BK/rollback.sh" || true' ERR

step "3/6 نسخ"
for f in "${FILES[@]}"; do mkdir -p "$(dirname "$f")"; cp "$SRC/$f" "$f"; php -l "$f" >/dev/null; echo "  ✓ $f"; done
grep -qF "$REQUIRE_LINE" routes/api.php || { printf '\n%s\n' "$REQUIRE_LINE" >> routes/api.php; echo "  ✓ routes/api.php"; }

step "4/6 migration"
php artisan migrate --path="$MIG" --force --no-ansi | sed 's/^/  /'

step "5/6 الكاش"
php artisan optimize:clear --no-ansi >/dev/null
php artisan route:list --path=api/v1/admin/misbaha-rooms --no-ansi | sed 's/^/  /'
trap - ERR

step "6/6 تجربة"
ok=1; code() { curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' "$@"; }
c=$(code "$API_URL/record-extras/project/1"); echo "  GET record-extras → $c (200/404)"; [[ $c == 200 || $c == 404 ]] || ok=0
c=$(code -X PUT "$API_URL/admin/record-extras/project/1"); echo "  PUT بدون دخول → $c (401)"; [[ $c == 401 ]] || ok=0
c=$(code -X DELETE "$API_URL/admin/misbaha-rooms/999999"); echo "  DELETE سبحة بدون دخول → $c (401)"; [[ $c == 401 ]] || ok=0
c=$(code "$API_URL/misbaha-rooms"); echo "  GET misbaha-rooms → $c (200)"; [[ $c == 200 ]] || ok=0
APP="$APP" php "$HERE/selftest.php" || ok=0
(( ok )) && green "✅ خلص. الرجوع: bash $BK/rollback.sh" || red "⚠️ الرجوع: bash $BK/rollback.sh"
