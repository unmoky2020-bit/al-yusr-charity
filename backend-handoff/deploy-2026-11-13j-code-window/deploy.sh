#!/usr/bin/env bash
# Al-Yusr API — code window (13 Nov 2026, j): email codes valid 30 minutes (was 15), up to 10 per hour
# (was 5). bash deploy.sh [--check]
set -euo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"; HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BK="$HOME/backups/code-window-$(date +%Y%m%d-%H%M%S)"; cd "$APP"
declare -A EXPECT=([app/Support/EmailCode.php]=e0554cf9c072fa233ffd1dbab096637d)
for f in "${!EXPECT[@]}"; do now=$(md5sum "$f" | cut -d' ' -f1); [[ "$now" == "${EXPECT[$f]}" ]] || { echo "اتغير على السيرفر: $f ($now) — مفيش تعديل"; exit 1; }; php -l "$HERE/files/$f" >/dev/null; done
echo "الفحص تمام."; [[ "${1:-}" == "--check" ]] && exit 0
mkdir -p "$BK"; printf '#!/usr/bin/env bash\ncd %s\n' "$APP" > "$BK/rollback.sh"
for f in "${!EXPECT[@]}"; do mkdir -p "$BK/$(dirname "$f")"; cp "$f" "$BK/$f"; cp "$HERE/files/$f" "$f"; echo "cp $BK/$f $f" >> "$BK/rollback.sh"; echo "  ✓ $f"; done
php -r 'require "vendor/autoload.php"; $a=require "bootstrap/app.php"; $a->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo "  TTL=", App\Support\EmailCode::TTL_MINUTES, " دقيقة\n";'
echo "✅ تمام. الرجوع: bash $BK/rollback.sh"
