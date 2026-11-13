#!/usr/bin/env bash
# Al-Yusr API — site block «about_teaser» (home page «من نحن» from the dashboard). bash deploy.sh [--check]
set -euo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"; HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
F=app/Http/Controllers/Api/V1/Extras/SiteBlockController.php; OLD=ec6bd4dbe6f35863b86adda3961bd176
BK="$HOME/backups/about-teaser-$(date +%Y%m%d-%H%M%S)"; cd "$APP"
[[ "$(md5sum "$F" | cut -d' ' -f1)" == "$OLD" ]] || { echo "اتغير على السيرفر: $F — مفيش تعديل"; exit 1; }
php -l "$HERE/files/$F" >/dev/null; echo "الفحص تمام."; [[ "${1:-}" == "--check" ]] && exit 0
mkdir -p "$BK/$(dirname "$F")"; cp "$F" "$BK/$F"; printf '#!/usr/bin/env bash\ncp %s %s/%s && cd %s && php artisan optimize:clear\n' "$BK/$F" "$APP" "$F" "$APP" > "$BK/rollback.sh"
cp "$HERE/files/$F" "$F"; php artisan optimize:clear >/dev/null
c=$(curl -s -o /dev/null -w '%{http_code}' -X PUT -H 'Accept: application/json' https://api.elyusr.org/api/v1/admin/site-blocks/about_teaser || true)
echo "  PUT about_teaser بدون دخول → $c (401)"
php artisan route:list --path=site-blocks --no-ansi | sed 's/^/  /'
echo "✅ تمام. الرجوع: bash $BK/rollback.sh"
