#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Tell Bing / Yandex / Seznam (IndexNow) that pages changed. Google doesn't use IndexNow:
#  for Google use Search Console → URL inspection → «طلب الفهرسة» (docs/INDEXING.md).
#  Run on the server (it has internet; the cloud session doesn't):
#    bash indexnow-submit.sh --check            → prints the list only
#    bash indexnow-submit.sh                    → today's batch (docs/INDEXING.md order)
#    bash indexnow-submit.sh /donate /qurbani   → only these paths
#  The key file is public/d061ba9d2cbbef45eab1eeb47c81df24.txt (already on the site).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
HOST="elyusr.org"
KEY="d061ba9d2cbbef45eab1eeb47c81df24"
CHECK=0; [[ "${1:-}" == "--check" ]] && { CHECK=1; shift; }

if (( $# > 0 )); then
  PATHS=("$@")
else
  PATHS=(/donate-from-abroad /qurbani /donate /charity-mansoura /charity-egypt /zakat /water /food-box /cases /trust /misbaha /volunteer /contact
         /programs/orphans /programs/treatment /programs/bride /programs/education /programs/zakat /programs/kitchen /programs/quran /programs/monthly-sponsorship)
fi

TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
{
  printf '{"host":"%s","key":"%s","keyLocation":"https://%s/%s.txt","urlList":[' "$HOST" "$KEY" "$HOST" "$KEY"
  first=1
  for p in "${PATHS[@]}"; do
    [[ "$p" == /* ]] || p="/$p"
    (( first )) || printf ','
    printf '"https://%s%s"' "$HOST" "$p"; first=0
  done
  printf ']}'
} > "$TMP"

echo "الصفحات (${#PATHS[@]}):"
for p in "${PATHS[@]}"; do [[ "$p" == /* ]] || p="/$p"; echo "  https://$HOST$p"; done
(( CHECK )) && { echo "(--check) ما اتبعتش حاجة."; exit 0; }

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "https://api.indexnow.org/indexnow" \
  -H 'Content-Type: application/json; charset=utf-8' --data-binary @"$TMP")
case "$code" in
  200|202) echo "✅ اتبعتت لـ IndexNow ($code)";;
  403) echo "⚠️ 403: ملف المفتاح مش ظاهر على https://$HOST/$KEY.txt"; exit 1;;
  422) echo "⚠️ 422: في رابط مش تبع $HOST"; exit 1;;
  429) echo "⚠️ 429: كتير — جرّب بكرة"; exit 1;;
  *)   echo "⚠️ رد غير متوقع: $code"; exit 1;;
esac
