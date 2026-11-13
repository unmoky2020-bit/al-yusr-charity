#!/usr/bin/env bash
# Al-Yusr API — accounts (13 Nov 2026, f)
#   • sign-up with the email/phone of a deleted account works (the deleted account gives them up, originals kept)
#   • the email hooks after each request run at most once a minute (less load on the shared database)
#   bash deploy.sh --check  /  bash deploy.sh
set -Eeuo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; SRC="$HERE/files"
STAMP="$(date +%Y%m%d-%H%M%S)"; BK="$HOME/backups/accounts-$STAMP"
CHECK_ONLY=0; [[ "${1:-}" == "--check" ]] && CHECK_ONLY=1
MIG=database/migrations/2026_11_13_310000_create_released_identities.php
NEW=(app/Support/IdentityRelease.php "$MIG")
REPLACED=(app/Providers/MailSystemServiceProvider.php)
declare -A EXPECT=([app/Providers/MailSystemServiceProvider.php]=f0def0d50353d6e13dd1ca98b9827b7e)
green() { printf '\033[32m%s\033[0m\n' "$*"; }; red() { printf '\033[31m%s\033[0m\n' "$*"; }; step() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

step "1/4 فحص"; cd "$APP"; P=0
for f in "${REPLACED[@]}"; do now=$(md5sum "$f" | cut -d' ' -f1); [[ "$now" == "${EXPECT[$f]}" ]] || { red "  $f اتغير ($now)"; P=$((P+1)); }; done
for f in "${NEW[@]}"; do [[ -e "$f" ]] && { red "  $f موجود"; P=$((P+1)); }; done
for f in $(cd "$SRC" && find . -name '*.php'); do php -l "$SRC/$f" >/dev/null || { red "  syntax $f"; P=$((P+1)); }; done
(( P > 0 )) && { red "في $P مشكلة. مفيش حاجة اتغيرت."; exit 1; }
green "الفحص تمام."; (( CHECK_ONLY )) && exit 0

step "2/4 نسخة احتياطية → $BK"
mkdir -p "$BK"; for f in "${REPLACED[@]}"; do mkdir -p "$BK/$(dirname "$f")"; cp "$f" "$BK/$f"; done
cat > "$BK/rollback.sh" <<RB
#!/usr/bin/env bash
cd "$APP"; for f in ${REPLACED[*]}; do cp "$BK/\$f" "\$f"; done
php artisan migrate:rollback --path=$MIG --force --no-ansi || true; rm -f ${NEW[*]}
php artisan optimize:clear >/dev/null; echo "رجع زي ما كان."
RB
chmod +x "$BK/rollback.sh"; trap 'red "خطأ — برجّع"; bash "$BK/rollback.sh" || true' ERR

step "3/4 نسخ + migration"
for f in "${NEW[@]}" "${REPLACED[@]}"; do mkdir -p "$(dirname "$f")"; cp "$SRC/$f" "$f"; echo "  ✓ $f"; done
php artisan migrate --path="$MIG" --force --no-ansi | sed 's/^/  /'
php artisan optimize:clear --no-ansi >/dev/null
trap - ERR

step "4/4 تجربة"
APP="$APP" php "$HERE/selftest.php" && green "✅ خلص. الرجوع: bash $BK/rollback.sh" || red "⚠️ الرجوع: bash $BK/rollback.sh"
