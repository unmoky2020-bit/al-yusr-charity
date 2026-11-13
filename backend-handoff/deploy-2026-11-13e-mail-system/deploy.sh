#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Al-Yusr API — email system (13 Nov 2026, e)
#    • mail_outbox: every email, sent in batches under the daily limit (pump: cron + after requests)
#    • new design for every email (MailRenderer), codes included
#    • automatic emails: welcome, receipt, delivery steps, case update, volunteer
#    • newsletter campaigns from blocks, scheduling, one-click unsubscribe, open/click counts
#    • misbaha followers: goal reached + Friday digest
#  bash deploy.sh --check  /  bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
API_URL="${API_URL:-https://api.elyusr.org/api/v1}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; SRC="$HERE/files"
STAMP="$(date +%Y%m%d-%H%M%S)"; BK="$HOME/backups/mail-system-$STAMP"
CHECK_ONLY=0; [[ "${1:-}" == "--check" ]] && CHECK_ONLY=1
REQUIRE_API="require __DIR__.'/api-2026-11-13e-mail.php';"
REQUIRE_CONSOLE="require __DIR__.'/console-mail.php';"
PROVIDER="App\\Providers\\MailSystemServiceProvider::class,"
MIG=database/migrations/2026_11_13_300000_mail_system.php
NEW=(app/Support/Mail/MailRenderer.php app/Support/Mail/MailOutbox.php app/Support/Mail/MailSettings.php app/Support/Mail/MailTemplates.php app/Support/Mail/MisbahaMail.php
     app/Providers/MailSystemServiceProvider.php app/Console/Commands/MailPump.php
     app/Http/Controllers/Api/V1/Mail/MailAdminController.php app/Http/Controllers/Api/V1/Mail/MailPublicController.php
     routes/api-2026-11-13e-mail.php routes/console-mail.php "$MIG")
REPLACED=(app/Support/BrandMail.php app/Http/Controllers/Api/V1/Newsletter/NewsletterCampaignController.php app/Http/Controllers/Api/V1/Newsletter/NewsletterPublicController.php app/Models/NewsletterCampaign.php)
declare -A EXPECT=(
  [app/Support/BrandMail.php]=389f9c0ce5ae0a298821e45531782190
  [app/Http/Controllers/Api/V1/Newsletter/NewsletterCampaignController.php]=d675329799a182489c3c61fe75189047
  [app/Http/Controllers/Api/V1/Newsletter/NewsletterPublicController.php]=7543d81a784c39fe0ab70ef9f7df9a20
  [app/Models/NewsletterCampaign.php]=842619dd15a1d7be33f4fcc4f14fd1bf
)
green() { printf '\033[32m%s\033[0m\n' "$*"; }; red() { printf '\033[31m%s\033[0m\n' "$*"; }; step() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

step "1/6 فحص"
cd "$APP"; php artisan --version
P=0
for f in "${REPLACED[@]}"; do
  now=$(md5sum "$f" | cut -d' ' -f1)
  [[ "$now" == "${EXPECT[$f]}" ]] || { red "  $f اتغير على السيرفر ($now)"; P=$((P+1)); }
done
for f in "${NEW[@]}"; do [[ -e "$f" ]] && { red "  $f موجود بالفعل"; P=$((P+1)); }; done
[[ -f bootstrap/providers.php ]] || { red "  مفيش bootstrap/providers.php"; P=$((P+1)); }
for f in $(cd "$SRC" && find . -name '*.php'); do php -l "$SRC/$f" >/dev/null || { red "  syntax $f"; P=$((P+1)); }; done
(( P > 0 )) && { red "في $P مشكلة. مفيش حاجة اتغيرت."; exit 1; }
envval() { { grep -E "^$1=" .env || true; } | tail -1 | cut -d= -f2- | sed -e 's/\r$//' -e "s/^[\"']//" -e "s/[\"']$//"; }
echo "  MAIL_MAILER=$(envval MAIL_MAILER)"
green "الفحص تمام."; (( CHECK_ONLY )) && { green "(--check) مفيش تعديل."; exit 0; }

step "2/6 نسخة احتياطية → $BK"
mkdir -p "$BK"
for f in "${REPLACED[@]}" routes/api.php routes/console.php bootstrap/providers.php; do mkdir -p "$BK/$(dirname "$f")"; cp "$f" "$BK/$f"; done
cat > "$BK/rollback.sh" <<RB
#!/usr/bin/env bash
cd "$APP"; php artisan migrate:rollback --path=$MIG --force --no-ansi || true
for f in ${REPLACED[*]} routes/api.php routes/console.php bootstrap/providers.php; do cp "$BK/\$f" "\$f"; done
rm -f ${NEW[*]}
php artisan optimize:clear >/dev/null; echo "رجع زي ما كان."
RB
chmod +x "$BK/rollback.sh"; trap 'red "خطأ — برجّع"; bash "$BK/rollback.sh" || true' ERR

step "3/6 نسخ"
for f in "${NEW[@]}" "${REPLACED[@]}"; do mkdir -p "$(dirname "$f")"; cp "$SRC/$f" "$f"; php -l "$f" >/dev/null; echo "  ✓ $f"; done
grep -qF "$REQUIRE_API" routes/api.php || { printf '\n%s\n' "$REQUIRE_API" >> routes/api.php; echo "  ✓ routes/api.php"; }
grep -qF "$REQUIRE_CONSOLE" routes/console.php || { printf '\n%s\n' "$REQUIRE_CONSOLE" >> routes/console.php; echo "  ✓ routes/console.php"; }
grep -qF "MailSystemServiceProvider" bootstrap/providers.php || {
  php -r '$f="bootstrap/providers.php"; $s=file_get_contents($f); $p=strrpos($s,"];"); if($p===false) exit(1); file_put_contents($f, substr($s,0,$p)."    App\\Providers\\MailSystemServiceProvider::class,\n".substr($s,$p));'
  php -l bootstrap/providers.php >/dev/null; echo "  ✓ bootstrap/providers.php"; }

step "4/6 migration"
php artisan migrate --path="$MIG" --force --no-ansi | sed 's/^/  /'

step "5/6 الكاش"
php artisan optimize:clear --no-ansi >/dev/null
php artisan route:list --path=api/v1/admin/mail --no-ansi | sed 's/^/  /'
php artisan schedule:list --no-ansi | sed 's/^/  /'
trap - ERR

step "6/6 تجربة"
ok=1; code() { curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' "$@"; }
c=$(code "$API_URL/admin/mail/overview"); echo "  overview بدون دخول → $c (401)"; [[ $c == 401 ]] || ok=0
c=$(code "$API_URL/mail/o/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.gif"); echo "  open pixel → $c (200)"; [[ $c == 200 ]] || ok=0
c=$(code "$API_URL/mail/c/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA?u=x&s=y"); echo "  click بتوقيع غلط → $c (302 للموقع)"; [[ $c == 302 ]] || ok=0
c=$(code -X POST "$API_URL/misbaha-subscriptions/confirm" -d token=x); echo "  confirm بتوكن غلط → $c (422)"; [[ $c == 422 ]] || ok=0
c=$(code "$API_URL/misbaha-rooms"); echo "  misbaha-rooms → $c (200)"; [[ $c == 200 ]] || ok=0
c=$(code "$API_URL/site-blocks"); echo "  site-blocks → $c (200)"; [[ $c == 200 ]] || ok=0
php artisan mail:pump --max=0 --no-ansi && echo "  ✓ mail:pump شغال"
APP="$APP" php "$HERE/selftest.php" || ok=0
(( ok )) && green "✅ خلص. الرجوع: bash $BK/rollback.sh" || red "⚠️ في حاجة مش مظبوطة. الرجوع: bash $BK/rollback.sh"
