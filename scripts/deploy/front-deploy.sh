#!/usr/bin/env bash
# نشر واجهة الموقع (elyusr.org): فحص ← نسخة احتياطية ← نسخ ← تجربة.
#   bash deploy.sh --check   فحص بس، من غير أي تعديل
#   bash deploy.sh           النشر
# مبيمسحش أي ملف موجود على السيرفر (ملفات التحقق والصور القديمة بتفضل زي ما هي).
set -euo pipefail
cd "$(dirname "$0")"
TARGET="$HOME/domains/elyusr.org/public_html"
SRC="$PWD/site"
TS=$(date +%Y%m%d-%H%M%S)
BK="$HOME/backups/front-$TS"
step(){ printf '\n▶ %s\n' "$1"; }

step "1/4 فحص قبل أي تعديل"
[ -f "$TARGET/index.html" ] || { echo "✗ مش لاقي $TARGET/index.html"; exit 1; }
[ -f "$SRC/index.html" ] && [ -f "$SRC/sitemap.php" ] && [ -f "$SRC/.htaccess" ] || { echo "✗ ملفات النسخة الجديدة ناقصة"; exit 1; }
php -v | head -1
for f in sitemap.php seo.php; do php -l "$SRC/$f" >/dev/null && echo "  ✓ $f سليم"; done
echo "  ملفات جديدة: $(find "$SRC" -type f | wc -l) | مساحة: $(du -sh "$SRC" | cut -f1)"
if [ -f "$TARGET/.htaccess" ]; then
  if cmp -s "$TARGET/.htaccess" "$SRC/.htaccess"; then echo "  .htaccess: زي ما هو"; else
    echo "  .htaccess هيتغيّر (الفرق):"; diff "$TARGET/.htaccess" "$SRC/.htaccess" | grep '^[<>]' | head -20 | sed 's/^/    /'; fi || true
fi
echo "الفحص تمام."
if [ "${1:-}" = "--check" ]; then echo "(--check) مفيش أي تعديل اتعمل."; exit 0; fi

step "2/4 نسخة احتياطية → $BK"
mkdir -p "$BK"
tar -czf "$BK/public_html.tgz" -C "$TARGET" .
cat > "$BK/rollback.sh" <<RB
#!/usr/bin/env bash
# يرجّع الموقع زي ما كان قبل النشر ده بالظبط
set -e
rm -rf "$TARGET.rollback-tmp" && mkdir "$TARGET.rollback-tmp"
tar -xzf "$BK/public_html.tgz" -C "$TARGET.rollback-tmp"
rsync -a --delete "$TARGET.rollback-tmp/" "$TARGET/" 2>/dev/null || { cp -a "$TARGET.rollback-tmp/." "$TARGET/"; }
rm -rf "$TARGET.rollback-tmp"
echo "✅ رجع زي ما كان."
RB
echo "اتاخدت: public_html.tgz ($(du -sh "$BK/public_html.tgz" | cut -f1)) + rollback.sh"

step "3/4 نسخ الملفات"
# 1) كل الملفات ما عدا index.html  2) نتأكد إن كل ملف وصل بنفس الحجم  3) بعدها بس index.html
mkdir -p "$TARGET/assets"
cp -R "$SRC/assets/." "$TARGET/assets/" || echo "  ✗ في ملفات ماتنسختش (التفاصيل فوق)"
find "$SRC" -mindepth 1 -maxdepth 1 ! -name assets ! -name index.html -print0 | while IFS= read -r -d '' f; do cp -R "$f" "$TARGET/" || echo "  ✗ $f"; done
missing=0; find "$SRC" -type f -print0 > "$HOME/.deploy-files.lst"
while IFS= read -r -d '' f; do
  rel="${f#$SRC/}"; [ "$rel" = index.html ] && continue
  t="$TARGET/$rel"
  if [ ! -f "$t" ] || [ "$(stat -c %s "$f")" != "$(stat -c %s "$t")" ]; then missing=$((missing+1)); [ $missing -le 5 ] && echo "  ✗ ناقص: $rel"; fi
done < "$HOME/.deploy-files.lst"
if [ $missing -gt 0 ]; then
  echo "✗ $missing ملف موصلش. index.html ما اتغيّرش، فالموقع شغال بالنسخة اللي قبلها. ابعت الرسالة دي."
  df -h "$HOME" 2>/dev/null | tail -1
  exit 1
fi
cp "$SRC/index.html" "$TARGET/index.html"
rm -f /tmp/elyusr-sitemap-*.xml 2>/dev/null || true
echo "  ✓ اتنسخ $(find "$SRC" -type f | wc -l) ملف، وكلهم موجودين بنفس الحجم"

step "4/4 تجربة"
code(){ curl -s -o /dev/null -w '%{http_code}' "$1"; }
ok=1
for u in / /blog /stories /campaigns /misbaha /sitemap.xsl /robots.txt; do
  c=$(code "https://elyusr.org$u"); printf '  %-14s → %s\n' "$u" "$c"; [ "$c" = 200 ] || ok=0
done
for a in $(grep -o 'assets/index-[A-Za-z0-9_-]*\.\(js\|css\)' "$TARGET/index.html" | sort -u); do
  ct=$(curl -s -o /dev/null -w '%{content_type}' "https://elyusr.org/$a?check=$TS"); printf '  %-30s → %s\n' "$a" "$ct"
  case "$ct" in *javascript*|*css*) ;; *) ok=0 ;; esac
done
SM=$(curl -s "https://elyusr.org/sitemap.xml")
echo "  /sitemap.xml   → روابط: $(grep -o '<url>' <<<"$SM" | wc -l) | تصميم: $(grep -q 'sitemap.xsl' <<<"$SM" && echo موجود || echo مش موجود) | مقالات: $(grep -o '/blog/[^<]*' <<<"$SM" | wc -l)"
grep -q '<urlset' <<<"$SM" || ok=0
if [ $ok = 1 ]; then echo; echo "✅ النشر خلص. النسخة الاحتياطية: $BK"; else
  echo; echo "⚠ في صفحة مردّتش 200. لو الموقع مش شغال رجّعه بـ: bash $BK/rollback.sh"; fi
