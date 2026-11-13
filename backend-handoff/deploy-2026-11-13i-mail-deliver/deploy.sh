#!/usr/bin/env bash
# Al-Yusr API — mail deliverability (13 Nov 2026, i): no zero-width preheader filler, no external font
# stylesheet, code emails without the social links block. bash deploy.sh [--check]
set -euo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"; HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BK="$HOME/backups/mail-deliver-$(date +%Y%m%d-%H%M%S)"; cd "$APP"
declare -A EXPECT=([app/Support/Mail/MailRenderer.php]=fbe4aedb0f1ad888964a681ada355de2 [app/Support/BrandMail.php]=d0377ad616f7b145b0a93f706c39ec2f)
for f in "${!EXPECT[@]}"; do now=$(md5sum "$f" | cut -d' ' -f1); [[ "$now" == "${EXPECT[$f]}" ]] || { echo "اتغير على السيرفر: $f ($now) — مفيش تعديل"; exit 1; }; php -l "$HERE/files/$f" >/dev/null; done
echo "الفحص تمام."; [[ "${1:-}" == "--check" ]] && exit 0
mkdir -p "$BK"; printf '#!/usr/bin/env bash\ncd %s\n' "$APP" > "$BK/rollback.sh"
for f in "${!EXPECT[@]}"; do mkdir -p "$BK/$(dirname "$f")"; cp "$f" "$BK/$f"; cp "$HERE/files/$f" "$f"; echo "cp $BK/$f $f" >> "$BK/rollback.sh"; echo "  ✓ $f"; done
php -r 'require "vendor/autoload.php"; $a=require "bootstrap/app.php"; $a->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); App\Support\BrandMail::send("support@elyusr.org", "رمز تجربة — مؤسسة اليسر الخيرية", ["title"=>"رمز تجربة","greeting"=>"أهلًا،","lines"=>["ده رمز تجربة بعد تحديث الإيميل:"],"code"=>"123456","after"=>["الرمز صالح لمدة 15 دقيقة."]]); echo "  ✓ رسالة رمز تجربة اتبعتت لـ support@\n";'
echo "✅ تمام. الرجوع: bash $BK/rollback.sh"
