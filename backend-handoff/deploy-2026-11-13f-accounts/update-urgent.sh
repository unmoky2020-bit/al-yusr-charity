#!/usr/bin/env bash
# Update after deploy.sh (13 Nov, f): confirmations/receipts go out right after the request that queued them.
set -euo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"; HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BK="$HOME/backups/accounts-urgent-$(date +%Y%m%d-%H%M%S)"; cd "$APP"
declare -A EXPECT=([app/Providers/MailSystemServiceProvider.php]=cb92655b982cda2da75ad3fd7dff725a [app/Support/Mail/MailOutbox.php]=cb1decef03999cbf3bcfb0a17bd24952)
for f in "${!EXPECT[@]}"; do [[ "$(md5sum "$f" | cut -d' ' -f1)" == "${EXPECT[$f]}" ]] || { echo "اتغير على السيرفر: $f — مفيش تعديل"; exit 1; }; done
mkdir -p "$BK"; for f in "${!EXPECT[@]}"; do mkdir -p "$BK/$(dirname "$f")"; cp "$f" "$BK/$f"; cp "$HERE/files/$f" "$f"; php -l "$f" >/dev/null; echo "  ✓ $f"; done
printf '#!/usr/bin/env bash\ncd %s\n' "$APP" > "$BK/rollback.sh"; for f in "${!EXPECT[@]}"; do echo "cp $BK/$f $f" >> "$BK/rollback.sh"; done; echo "php artisan optimize:clear" >> "$BK/rollback.sh"
php artisan optimize:clear >/dev/null; APP="$APP" php "$HERE/selftest.php" && echo "✅ تمام. الرجوع: bash $BK/rollback.sh"
