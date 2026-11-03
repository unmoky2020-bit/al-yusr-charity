# حالة المشروع — مؤسسة اليسر الخيرية (elyusr.org)

> **أول ملف يتقري في أي جلسة جديدة.** بعد كل شريحة شغل اتكتب هنا: اللي خلص، واللي فاضل، وأوامر التشغيل والنشر.
> آخر تحديث: 3 نوفمبر 2026.

## 1) المشروع في سطرين
موقع ولوحة تحكم لمؤسسة خيرية مصرية مشهرة (رقم 2665 لسنة 2019، المنصورة، الدقهلية). الموقع بيستقبل التبرعات (كاشير والتحويل اليدوي)، ويعرض البرامج والمشاريع والحملات والحالات الإنسانية والمدونة والقصص، وفيه مسبحة إلكترونية ونشرة بريدية. لوحة التحكم بيستخدمها فريق المؤسسة لإدارة المحتوى والتبرعات والحالات.

## 2) الأجزاء والمكان
| الجزء | التقنية | المكان |
|---|---|---|
| الواجهة (الموقع + لوحة التحكم) | React 18 + Vite 5 + TypeScript + Tailwind + shadcn/Radix + TanStack Query | المستودع ده. بيتنشر على `elyusr.org` (Hostinger، `~/domains/elyusr.org/public_html`) |
| الـ API | Laravel 12.70 + PHP 8.3 + MySQL | **على السيرفر بس** في `~/domains/api.elyusr.org/public_html`. مفيش مستودع git حديث للباك إند، والكود بيتعدّل على السيرفر مباشرة (منّنا ومن مطوّر تاني) |
| ملفات PHP في الواجهة | `public/seo.php` (ميتا لكل صفحة)، `public/sitemap.php` (سايت ماب مباشر)، `public/.htaccess` | بتتنشر مع الواجهة |
| تعديلات الباك إند اللي عملناها | `backend-handoff/deploy-*` (حزم نشر بفحص وباك أب ورجوع) و `backend-handoff/patches/*` | المستودع ده |

## 3) المستودع والفروع
- المستودع: `github.com/unmoky2020-bit/al-yusr-charity` — **عام (Public) حاليًا، ولازم يتحوّل Private.**
- `main` = `fix/review-2026-11` = آخر شغل.
- `release/live-2026-11-03` = النسخة المنشورة على الموقع (الواجهة من `ed51c8f` و `.htaccess` من `d6cbc4c`).
- ريموت قديم: `eldakrouryy/al-yusr-charity` (مرجع بس، ما بنرفعش عليه).
- رفع الـ tags مقفول من بيئة Claude السحابية (403)، فالنسخ الثابتة بتتحفظ كفروع `release/*`.

## 4) التشغيل والاختبار محليًا
```bash
npm ci
npm run dev            # http://localhost:8080 — الـ API بيروح لـ /api/v1 عن طريق proxy في vite.config.ts
npx tsc --noEmit -p tsconfig.app.json   # لازم 0 أخطاء
npm test               # 133 اختبار في 26 ملف (vitest)
npm run build          # بيولّد public/sitemap-base.xml كمان
npx eslint .           # الأساس الحالي: 412 خطأ و 87 تحذير (قديمة، معظمها any وcatch فاضي)
```

## 5) نشر الواجهة (اتجرّب 3 نوفمبر)
```bash
bash scripts/deploy/pack-front.sh        # build + deploy-out/front-1-assets.tgz + front-2-site.tgz (كل واحد أقل من 30MB)
```
على جهاز صاحب المشروع (PowerShell) ثم على السيرفر:
```powershell
scp -P <port> front-1-assets.tgz front-2-site.tgz <user>@<host>:~/
ssh -p <port> <user>@<host>
```
```bash
rm -rf ~/front-new && mkdir ~/front-new && cd ~/front-new && tar -xzf ~/front-1-assets.tgz && tar -xzf ~/front-2-site.tgz && bash deploy.sh --check && bash deploy.sh
```
- `deploy.sh` بياخد باك أب كامل لـ `public_html` + `rollback.sh` في `~/backups/front-<التاريخ>/`، وينسخ من غير ما يمسح، ويتأكد إن كل ملف وصل بنفس الحجم **قبل** ما يغيّر `index.html`، وبعدين يجرّب الصفحات وأنواع ملفات JS/CSS والسايت ماب.
- السيرفر مافيهوش `/dev/fd` (process substitution مش شغال في bash)، فالسكريبتات متكتبة من غيره.
- `front-2-site.tgz` فيه `MANIFEST.txt` (حجم ومسار كل ملف في البناء): `deploy.sh` بيرفض يبدأ لو `front-1` من بناء تاني، وبيتأكد إن كل ملف `index.html` بيطلبه موجود. ولو التجربة بعد النشر فشلت، بيرجّع `index.html` و `.htaccess` و `seo.php` و `sitemap.php` القديمة لوحده.
- بعد ما تبعت الملفين لجهاز صاحب المشروع، اعمل stage ليهم وقارن md5 قبل ما تقوله يرفعهم.
- الرجوع: `bash ~/backups/front-<التاريخ>/rollback.sh`.

## 6) نشر الباك إند
- كل تعديل بيبقى حزمة في `backend-handoff/deploy-YYYY-MM-DD/`: `files/` بنفس مسارات Laravel، و `expected-base.sha256` (بصمة الملفات على السيرفر قبل التعديل)، و `deploy.sh` (`--check` الأول، بعدها نشر بباك أب للكود وقاعدة البيانات ورجوع تلقائي لو حصل خطأ).
- السكريبت **مبيكتبش فوق ملف اتغيّر على السيرفر** من وقت ما اتاخدت البصمة، علشان فيه مطوّر تاني بيعدّل هناك.
- اتنشر لحد دلوقتي: `2026-11-02` (السبحة المشتركة + الاشتراك العام في النشرة)، `2026-11-03` (مكتبة الوسائط v2)، `2026-11-03b` (دمج الصور المكررة: 84 رابط اتعدّل و 81 نسخة اتنقلت للسلة)، `2026-11-03c` (BlogSeo: 49 مقال كلهم ليهم سجل سيو).
- فحص السيرفر (قراية بس): `scripts/server/audit-backend.sh` — شغّله وحط نتيجته في `docs/AUDIT-2026-11-03.md`.

## 7) الوصول للسيرفر
- الدخول بمفتاح SSH من جهاز صاحب المشروع (اتضاف 3 نوفمبر). بيانات الدخول في hPanel ← SSH Access. **ممنوع** أي باسورد في الشات أو في الكود.
- بيئة Claude السحابية **ما بتوصلش** لـ `api.elyusr.org` ولا لـ `elyusr.org` (مش في قائمة السماح)، ولا عندها SSH للسيرفر. صاحب المشروع بيشغّل الأوامر ويبعت النتيجة. ممكن يضيف الدومينين في claude.ai ← Settings ← Capabilities.
- الجسر لجهاز صاحب المشروع (Claude desktop) بيسمح بقراية وكتابة الملفات في فولدر المشروع على جهازه بس (`C:\Users\El mostafa\Desktop\al-yusr-charity-feat-about-trust-terms-quick-donate`) — مفيش Terminal عليه.
- صاحب المشروع على Windows: أوامر جهازه بـ PowerShell (مفيش `&&` في Windows PowerShell 5)، وأوامر السيرفر bash. وضّح دايمًا كل أمر بيتكتب فين.

## 8) اللي على صاحب المشروع (من غير كود)
1. يحوّل المستودع لـ Private، ويغيّر باسورد الاستضافة، ويراجع مفتاح SSH اسمه `Default-1` في hPanel.
2. Search Console: يضيف `https://elyusr.org/sitemap.xml`.
3. لوحة المدونة: يستورد المقالات الـ 8 («استيراد مقالات»)، ويكتب كلمة مفتاحية حقيقية لكل مقال ويدوس «نظّف المقال»، ويدوس «صور مشاركة للناقص».
4. يشغّل `scripts/server/audit-backend.sh` ويبعت النتيجة.

## 9) القرارات المهمة
في `docs/DECISIONS.md`. المراجعة الكاملة وخطة الشغل في `docs/AUDIT-2026-11-03.md`، والبرومبت الجاهز للجلسة الجاية في `docs/NEXT-SESSION-PROMPT.md`.
