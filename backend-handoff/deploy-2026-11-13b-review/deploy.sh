#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Al-Yusr API — review details + volunteer sign-up (13 Nov 2026, b)
#    • GET /admin/change-requests/details?ids=…  what an editor's change does (field, now, after)
#    • RegisterRequest: role may be volunteer too (the site's volunteer sign-up always got 422)
#  No table changes. One require line in routes/api.php; one rule in RegisterRequest.php.
#  bash deploy.sh --check   → checks only        bash deploy.sh → deploy (backup first, auto-rollback)
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
API_URL="${API_URL:-https://api.elyusr.org/api/v1}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/files"
STAMP="$(date +%Y%m%d-%H%M%S)"
BK="$HOME/backups/review-2026-11-13-$STAMP"
CHECK_ONLY=0; [[ "${1:-}" == "--check" ]] && CHECK_ONLY=1
REQUIRE_LINE="require __DIR__.'/api-2026-11-13b-review.php';"
REG="app/Http/Requests/Auth/RegisterRequest.php"
NEW_FILES=(app/Http/Controllers/Api/V1/Extras/ChangeRequestDetailsController.php routes/api-2026-11-13b-review.php)
green() { printf '\033[32m%s\033[0m\n' "$*"; }; red() { printf '\033[31m%s\033[0m\n' "$*"; }; step() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

step "1/5 فحص"
cd "$APP"; php artisan --version
P=0
for f in "${NEW_FILES[@]}"; do
  if [[ -f "$APP/$f" ]] && ! cmp -s "$APP/$f" "$SRC/$f"; then echo "  هيتحدّث (ملف البندل ده): $f"; fi
done
[[ -f "$APP/app/Support/StaffAccess.php" ]] || { red "  ناقص: app/Support/StaffAccess.php"; P=$((P+1)); }
if grep -q "'in:donor,editor,volunteer'" "$APP/$REG"; then echo "  RegisterRequest: المتطوع مسموح بالفعل";
elif [[ $(grep -c "'in:donor,editor'" "$APP/$REG") == 1 ]]; then echo "  RegisterRequest: هيتضاف volunteer";
else red "  RegisterRequest اتغير — مش هلمسه"; P=$((P+1)); fi
php artisan tinker --execute='echo DB::table("roles")->where("slug","volunteer")->exists() ? "  دور volunteer موجود\n" : "  دور volunteer مش موجود\n";' 2>/dev/null | tail -1
(( P > 0 )) && { red "في $P مشكلة. مش هكمّل."; exit 1; }
green "الفحص تمام."
(( CHECK_ONLY )) && { green "(--check) مفيش أي تعديل."; exit 0; }

step "2/5 نسخة احتياطية → $BK"
mkdir -p "$BK"; cp "$APP/routes/api.php" "$BK/api.php"; cp "$APP/$REG" "$BK/RegisterRequest.php"
cat > "$BK/rollback.sh" <<RB
#!/usr/bin/env bash
set -e
cp "$BK/api.php" "$APP/routes/api.php"; cp "$BK/RegisterRequest.php" "$APP/$REG"
rm -f "$APP/${NEW_FILES[0]}" "$APP/${NEW_FILES[1]}"
cd "$APP" && php artisan optimize:clear
echo "رجع."
RB
chmod +x "$BK/rollback.sh"
trap 'red "خطأ — برجّع…"; bash "$BK/rollback.sh" || true' ERR

step "3/5 نسخ وتعديل"
for f in "${NEW_FILES[@]}"; do mkdir -p "$APP/$(dirname "$f")"; cp "$SRC/$f" "$APP/$f"; php -l "$APP/$f" >/dev/null; echo "  ✓ $f"; done
grep -qF "$REQUIRE_LINE" "$APP/routes/api.php" || { printf '\n%s\n' "$REQUIRE_LINE" >> "$APP/routes/api.php"; echo "  ✓ routes/api.php"; }
sed -i "s/'in:donor,editor'/'in:donor,editor,volunteer'/" "$APP/$REG"; php -l "$APP/$REG" >/dev/null; echo "  ✓ $REG"
php -l "$APP/routes/api.php" >/dev/null

step "4/5 الكاش"
php artisan optimize:clear --no-ansi >/dev/null
php artisan route:list --path=api/v1/admin/change-requests --no-ansi | sed 's/^/  /'
trap - ERR

step "5/5 تجربة"
ok=1
c=$(curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' "$API_URL/admin/change-requests/details?ids=1"); echo "  بدون دخول → $c (401)"; [[ $c == 401 ]] || ok=0
c=$(curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' -H 'Content-Type: application/json' -X POST "$API_URL/register" -d '{"role":"volunteer"}')
b=$(curl -s -H 'Accept: application/json' -H 'Content-Type: application/json' -X POST "$API_URL/register" -d '{"role":"volunteer"}')
echo "  register role=volunteer (فاضي) → $c"; if echo "$b" | grep -q '"role"'; then red "  role لسه مرفوض"; ok=0; else echo "  ✓ role مقبول (الأخطاء على الحقول الفاضية بس)"; fi
APP="$APP" php "$HERE/selftest.php" || ok=0
(( ok )) && green "✅ خلص. الرجوع: bash $BK/rollback.sh" || red "⚠️ في تجربة مش زي المتوقع. الرجوع: bash $BK/rollback.sh"
