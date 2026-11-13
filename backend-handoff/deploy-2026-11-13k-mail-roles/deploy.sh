#!/usr/bin/env bash
# Al-Yusr API — mailbox roles (13 Nov 2026, k): every email's Reply-To and footer contact = info@
# (the public contact address, or org_info.email from the dashboard); the sending mailbox stays whatever
# .env says until the owner runs ~/mail-setup.sh with support@'s password. bash deploy.sh [--check]
set -euo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"; HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BK="$HOME/backups/mail-roles-$(date +%Y%m%d-%H%M%S)"; cd "$APP"
declare -A EXPECT=([app/Support/BrandMail.php]=22a95ce0616bf0d2314a07432b469178 [app/Support/Mail/MailRenderer.php]=41fd1cceec0e938b03c8713877a92f0f [app/Support/Mail/MailOutbox.php]=2217ced499d8425c2a9e7dc826ed15ef)
for f in "${!EXPECT[@]}"; do now=$(md5sum "$f" | cut -d' ' -f1); [[ "$now" == "${EXPECT[$f]}" ]] || { echo "اتغير على السيرفر: $f ($now) — مفيش تعديل"; exit 1; }; php -l "$HERE/files/$f" >/dev/null; done
echo "الفحص تمام."; [[ "${1:-}" == "--check" ]] && exit 0
mkdir -p "$BK"; printf '#!/usr/bin/env bash\ncd %s\n' "$APP" > "$BK/rollback.sh"
for f in "${!EXPECT[@]}"; do mkdir -p "$BK/$(dirname "$f")"; cp "$f" "$BK/$f"; cp "$HERE/files/$f" "$f"; echo "cp $BK/$f $f" >> "$BK/rollback.sh"; echo "  ✓ $f"; done
[[ -f "$HOME/mail-setup.sh" ]] && cp "$HOME/mail-setup.sh" "$BK/mail-setup.sh" && echo "cp $BK/mail-setup.sh $HOME/mail-setup.sh" >> "$BK/rollback.sh"
cp "$HERE/mail-setup.sh" "$HOME/mail-setup.sh"; echo "  ✓ ~/mail-setup.sh (support@ يبعت)"
php -r 'require "vendor/autoload.php"; $a=require "bootstrap/app.php"; $a->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo "  reply-to: ", App\Support\BrandMail::replyTo(), " | from: ", config("mail.from.address"), "\n"; $h = json_encode(App\Support\Mail\MailRenderer::render(["title"=>"t","lines"=>["x"]]), JSON_UNESCAPED_UNICODE); echo str_contains($h, "support@") ? "  ✗ support@ لسه في القالب\n" : "  ✓ القالب مفيهوش support@\n";' || echo "  (فحص القالب اتخطّى)"
echo "✅ تمام. الرجوع: bash $BK/rollback.sh"
