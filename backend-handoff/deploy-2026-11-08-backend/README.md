# 8 نوفمبر 2026 — إشعارات المتبرع، روابط البرامج، الحسابات، وصلاحيات المحرر

```
cd ~/deploy-2026-11-08-backend && bash deploy.sh --check && bash deploy.sh
```

`--check` بيقارن كل ملف هيتغيّر بالنسخة اللي التعديل مبني عليها (`expected-base.sha256`)، ولو حد عدّل ملف على السيرفر بعد كده النشر بيقف ومش بيكتب فوق شغله. قبل أي تعديل بياخد نسخة من الكود وقاعدة البيانات كاملة، ولو حصل خطأ بيرجّع الكود لوحده. مفيش migration ومفيش جداول جديدة.

## اللي بيتفعّل

**إشعارات لحساب المتبرع نفسه** (جوه الموقع + إشعار المتصفح، زي الأدمن):
- التبرع اتأكد (`paid`) ← «وصل تبرعك، جزاك الله خيرًا» ويفتح صفحة متابعة التبرع.
- الدفع ما كملش (`failed` / `cancelled`) ← «لم يكتمل تبرعك».
- تحديث جديد على حالة هو دافع لها ← «جديد عن الحالة التي دعمتها».

**روابط البرامج:** لو حد لزق رابط كامل زي `https://elyusr.org/water` بيتحول لـ `water`، والمسموح حروف إنجليزي صغيرة وأرقام وشرطة.

**نسيت كلمة السر:** `POST /forgot-password` بيبعت رمز من 6 أرقام على الإيميل، صالح 15 دقيقة و5 محاولات. الرد واحد سواء الإيميل موجود أو لأ. بعدها `POST /reset-password` بالرمز وكلمة السر الجديدة، وبيسجّل خروج الحساب من كل الأجهزة. أقصى 5 رموز في الساعة لنفس الإيميل.

**تأكيد البريد برمز:** `POST /email/verification-code` و `POST /email/verify` (للحساب المسجّل دخول)، وبيملا `email_verified_at`.

**الدخول بجوجل وفيسبوك:** `GET /auth/providers` و `POST /auth/google` و `POST /auth/facebook`. نفس الإيميل = نفس الحساب. حسابات فريق العمل (أي دور غير متبرع/متطوع) بتفضل تدخل بكلمة السر بس. الزراير مستخبية على الموقع لحد ما المفاتيح تتحط في `.env`:

```
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
FACEBOOK_APP_ID=xxxxxxxx
FACEBOOK_APP_SECRET=xxxxxxxx
```
بعدها `php artisan optimize:clear`. في جوجل: Authorized JavaScript origins = `https://elyusr.org`. في فيسبوك: App Domains = `elyusr.org` وفعّل Facebook Login for the web.

**السوبر أدمن يغيّر كلمة سر أي مستخدم:** `PUT /users/{user}/password` من صفحة المستخدم، وبيتسجّل في سجل النشاط (من غير الباسورد).

**صلاحيات المحرر:** `GET /me/access` بيرجّع صلاحيات الحساب، واللوحة بتبني القايمة منها. النشر بيخلّي دور **Editor للمدونة بس** (+ مكتبة الوسائط عشان صور المقالات)، وبيعمل دور إضافي **«محرر حالات»** (`case-editor`) تديه لمحرر معيّن من صفحته لو عايزه يضيف حالات. أي حاجة المحرر بيضيفها أو يعدّلها بتروح «مراجعة واعتماد التعديلات» ومتتنشرش غير بعد موافقة المدير (ده شغال من قبل بـ `editor.approval`؛ الفحص بيطبع السطور اللي بتحدده).
- صلاحيات المحرر القديمة بتتحفظ في النسخة الاحتياطية، و`rollback.sh` بيرجّعها.
- عايز تسيب صلاحيات المحرر زي ما هي؟ `KEEP_EDITOR=1 bash deploy.sh`
- ترجّعها بإيدك: `php artisan yusr:editor-access --restore=<الملف>` — تشوفها: `php artisan yusr:editor-access`

## لازم قبل ما الرموز توصل

البريد لازم يكون شغال على السيرفر. الفحص بيطبع `MAIL_MAILER`؛ لو `log` الرموز مش هتوصل لحد. من hPanel اعمل بريد زي `no-reply@elyusr.org` وحط في `.env`:

```
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_ENCRYPTION=ssl
MAIL_USERNAME=no-reply@elyusr.org
MAIL_PASSWORD=********
MAIL_FROM_ADDRESS=no-reply@elyusr.org
MAIL_FROM_NAME="مؤسسة اليسر الخيرية"
```
وبعدها `php artisan optimize:clear`.

## الرجوع

`bash ~/backups/2026-11-08-<الوقت>/rollback.sh` بيرجّع صلاحيات المحرر والكود. أمر استرجاع قاعدة البيانات كلها مكتوب في آخر الملف (للضرورة بس).
