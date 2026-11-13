<?php

namespace App\Support\Mail;

use App\Models\Donation;
use App\Models\User;
use App\Support\DeliverySteps;
use App\Support\NotifyDonor;
use Illuminate\Support\Facades\DB;

/**
 * What each automatic email says. Each method returns [subject, BrandMail data].
 * The wording follows the site: Egyptian Arabic, warm, short, one clear next step.
 */
final class MailTemplates
{
    public static function img(string $name): string
    {
        return MailRenderer::asset($name . '.jpg');
    }

    /** Four ongoing-charity cards for the end of an email ("صدقة جارية"). */
    public static function giveCards(int $n = 2, int $offset = 0): array
    {
        $all = [
            ['title' => 'سقيا الماء', 'text' => 'كوب مياه نضيفة لبيت في قرية، صدقة جارية ما بتقفش.', 'image' => self::img('hero-water'), 'url' => '/water', 'cta' => 'اسقِ عطشان', 'badge' => 'صدقة جارية'],
            ['title' => 'كفالة يتيم', 'text' => 'مصاريف شهرية وتعليم ورعاية لطفل فقد سنده.', 'image' => self::img('hero-orphans'), 'url' => '/programs/orphans', 'cta' => 'اكفل يتيم', 'badge' => 'شهري'],
            ['title' => 'إطعام الأسر', 'text' => 'كرتونة خير لأسرة محتاجة، بتوصل لحد الباب.', 'image' => self::img('hero-food'), 'url' => '/programs', 'cta' => 'أطعم أسرة'],
            ['title' => 'أثر يدوم', 'text' => 'مساجد وحضانات قرآن ومشاريع بتفضل بعدك.', 'image' => self::img('hero-sprout'), 'url' => '/mosques', 'cta' => 'ابنِ أثرك', 'badge' => 'صدقة جارية'],
        ];
        $out = [];
        for ($i = 0; $i < $n; $i++) {
            $out[] = $all[($offset + $i) % count($all)];
        }

        return $out;
    }

    private static function first(string $name): string
    {
        $name = trim(preg_replace('/\s+/u', ' ', $name));
        $first = $name !== '' ? explode(' ', $name)[0] : '';

        return $first !== '' ? "أهلًا {$first}،" : 'أهلًا بيك،';
    }

    private static function money($n): string
    {
        $f = (float) $n;

        return number_format($f, floor($f) == $f ? 0 : 2) . ' ج.م';
    }

    private static function arDate($when): string
    {
        $months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        $d = $when instanceof \DateTimeInterface ? \Carbon\Carbon::instance($when) : \Carbon\Carbon::parse($when ?: 'now');
        $d = $d->setTimezone('Africa/Cairo');

        return $d->day . ' ' . $months[$d->month - 1] . ' ' . $d->year;
    }

    /* ───────────── accounts ───────────── */

    public static function welcome(string $name): array
    {
        return ['أهلًا بيك في مؤسسة اليسر 🌿', [
            'title' => 'أهلًا بيك في عيلة اليسر',
            'eyebrow' => 'حسابك جاهز',
            'preheader' => 'من حسابك تتابع كل تبرع لحد ما يوصل لصاحبه.',
            'hero' => ['image' => self::img('hero-food'), 'alt' => 'متطوع من اليسر بيسلّم كرتونة خير', 'link' => '/'],
            'blocks' => [
                ['type' => 'text', 'text' => '**' . self::first($name) . '**'],
                ['type' => 'text', 'text' => 'حسابك في مؤسسة اليسر الخيرية اتعمل. من دلوقتي كل تبرع بتعمله بيبقى له صفحة متابعة: إمتى اتأكد، وإمتى اختارنا الأسرة، وإمتى وصل، بالصور.'],
                ['type' => 'list', 'items' => ['**تابع تبرعاتك** خطوة بخطوة من حسابك.', '**إيصال لكل تبرع** بيوصلك على الإيميل.', '**استقطاع شهري** لو حابب عطاءك يبقى مستمر.']],
                ['type' => 'button', 'label' => 'افتح حسابي', 'url' => '/dashboard'],
                ['type' => 'heading', 'text' => 'ابدأ من هنا'],
                ['type' => 'cards', 'items' => self::giveCards(2)],
                ['type' => 'quote', 'text' => '«ما نقصت صدقة من مال»', 'by' => 'رواه مسلم'],
            ],
            'reason' => 'وصلتك الرسالة دي لأنك عملت حساب على elyusr.org.',
        ]];
    }

    /* ───────────── donations ───────────── */

    public static function recipientOf(Donation $donation): ?array
    {
        try {
            $user = NotifyDonor::accountFor($donation);
            $donor = $donation->donor;
            $email = $user?->email ?: ($donor?->getAttributes()['email'] ?? null);
            $name = $user?->name ?: ($donor?->name ?? $donation->donor_name ?? '');
            if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return ['email' => $email, 'name' => (string) $name];
            }
        } catch (\Throwable $e) {
            report($e);
        }

        return null;
    }

    private static function methodLabel(?string $m): string
    {
        return match (strtolower((string) $m)) {
            'card', 'kashier', 'online', 'visa' => 'بطاقة بنكية',
            'vodafone_cash', 'wallet' => 'محفظة إلكترونية',
            'instapay' => 'إنستاباي',
            'bank', 'bank_transfer' => 'تحويل بنكي',
            'cash', 'pickup' => 'نقدًا (مندوب)',
            default => (string) $m,
        };
    }

    public static function receipt(Donation $d, string $name): array
    {
        $ref = (string) ($d->getAttributes()['transaction_reference'] ?? ('#' . $d->id));
        $target = NotifyDonor::targetName($d) ?: 'التبرع العام';
        $follow = NotifyDonor::followUrl($d);

        return ["إيصال تبرعك {$ref} — وصل، جزاك الله خيرًا", [
            'title' => 'وصل تبرعك، جزاك الله خيرًا',
            'eyebrow' => 'إيصال تبرع',
            'badge' => 'مدفوع',
            'preheader' => "تأكدنا من تبرعك بمبلغ " . self::money($d->amount) . " لـ«{$target}».",
            'blocks' => [
                ['type' => 'text', 'text' => '**' . self::first($name) . '**'],
                ['type' => 'text', 'text' => "تأكدنا من تبرعك لـ«{$target}». المبلغ ده أمانة عندنا، وهنبعتلك مع كل خطوة لحد ما يوصل لصاحبه."],
                ['type' => 'receipt', 'rows' => array_values(array_filter([
                    ['رقم التبرع', $ref],
                    ['التاريخ', self::arDate($d->updated_at ?? $d->created_at)],
                    ['لـ', $target],
                    $d->payment_method ? ['طريقة الدفع', self::methodLabel($d->payment_method)] : null,
                ])), 'total' => self::money($d->amount)],
                ['type' => 'steps', 'items' => [
                    ['label' => 'التبرع اتأكد', 'done' => true, 'note' => self::arDate($d->updated_at ?? now())],
                    ['label' => 'اختيار الأسرة المستحقة', 'current' => true],
                    ['label' => 'التسليم بالصور'],
                ]],
                ['type' => 'button', 'label' => 'تابع رحلة تبرعك', 'url' => $follow],
                ['type' => 'note', 'text' => 'الإيصال ده من مؤسسة اليسر الخيرية، مشهرة برقم 2665 لسنة 2019. احتفظ برقم التبرع لو حبيت تسأل عنه.'],
            ],
            'reason' => 'وصلتك الرسالة دي لأنك اتبرعت من خلال elyusr.org.',
        ]];
    }

    public static function failed(Donation $d, string $name): array
    {
        return ['تبرعك ما اكتملش — تقدر تحاول تاني', [
            'title' => 'تبرعك ما اكتملش',
            'eyebrow' => 'محتاجين خطوة منك',
            'blocks' => [
                ['type' => 'text', 'text' => '**' . self::first($name) . '**'],
                ['type' => 'text', 'text' => 'محاولة تبرعك بمبلغ ' . self::money($d->amount) . ' ما اكتملتش، ومفيش أي مبلغ اتخصم منك بسببها. لو حابب تكمّل، تقدر تحاول تاني أو تختار طريقة دفع تانية.'],
                ['type' => 'button', 'label' => 'حاول تاني', 'url' => '/donate'],
                ['type' => 'note', 'text' => 'لو المبلغ اتخصم فعلًا، رد على الرسالة دي برقم العملية وهنراجعها فورًا.'],
            ],
            'reason' => 'وصلتك الرسالة دي لأنك بدأت تبرع على elyusr.org.',
        ]];
    }

    private const STAGE = [
        'family_identified' => ['حددنا الأسرة المستحقة لتبرعك', 'فريقنا الميداني اختار الأسرة اللي هيوصلها تبرعك بعد البحث والتأكد من احتياجها.', 'خطوة 2 من 3', 'hero-volunteers'],
        'preparing' => ['بنجهّز تبرعك للأسرة', 'تبرعك بيتجهّز دلوقتي علشان يتسلّم للأسرة. هنبعتلك أول ما يوصل.', 'خطوة 2 من 3', 'hero-food'],
        'delivered' => ['تبرعك وصل للأسرة، جزاك الله خيرًا', 'تبرعك وصل لأسرة مستحقة. ربنا يتقبل منك ويجعله في ميزان حسناتك.', 'خطوة 3 من 3', 'hero-food'],
        'on_hold' => ['تسليم تبرعك اتأجل شوية', 'تبرعك محفوظ، والتسليم اتأجل لسبب في الميدان. هنبلغك أول ما نكمّل.', 'تحديث', 'hero-sprout'],
    ];

    public static function delivery(Donation $d, string $name, string $stage, ?string $note, array $photos): array
    {
        [$title, $text, $step, $hero] = self::STAGE[$stage] ?? ['تحديث على تبرعك', 'فيه خطوة جديدة في رحلة تبرعك.', 'تحديث', 'hero-food'];
        $target = NotifyDonor::targetName($d);
        $rank = DeliverySteps::rank($stage);
        $photo = null;
        foreach ($photos as $p) {
            if (is_string($p) && MailRenderer::safeUrl($p)) {
                $photo = $p;
                break;
            }
        }
        $blocks = [
            ['type' => 'text', 'text' => '**' . self::first($name) . '**'],
            ['type' => 'text', 'text' => $text . ($target ? " (تبرعك لـ«{$target}» بمبلغ " . self::money($d->amount) . ')' : '')],
        ];
        if ($stage === 'on_hold' && $note) {
            $blocks[] = ['type' => 'note', 'text' => 'السبب: ' . $note];
        }
        if ($photo) {
            $blocks[] = ['type' => 'image', 'url' => $photo, 'alt' => 'من التوزيع', 'caption' => 'من الميدان — الوشوش متغطية حفاظًا على كرامة الأسر.', 'link' => NotifyDonor::followUrl($d)];
        }
        $blocks[] = ['type' => 'steps', 'items' => [
            ['label' => 'التبرع اتأكد', 'done' => true],
            ['label' => 'اختيار الأسرة المستحقة', 'done' => $rank >= 0, 'current' => $rank < 0],
            ['label' => $rank >= 1 && $stage !== 'delivered' ? 'بيتجهّز للتسليم' : 'التسليم', 'done' => $stage === 'delivered', 'current' => $rank >= 0 && $stage !== 'delivered'],
        ]];
        $blocks[] = ['type' => 'button', 'label' => $stage === 'delivered' ? 'شوف صور التسليم' : 'تابع رحلة تبرعك', 'url' => NotifyDonor::followUrl($d)];
        if ($stage === 'delivered') {
            $blocks[] = ['type' => 'heading', 'text' => 'كمّل الأثر'];
            $blocks[] = ['type' => 'cards', 'items' => self::giveCards(2, (int) $d->id)];
        }

        return [$title, [
            'title' => $title,
            'eyebrow' => 'رحلة تبرعك · ' . $step,
            'badge' => $stage === 'delivered' ? 'تم التسليم' : '',
            'hero' => $photo ? null : ['image' => self::img($hero), 'alt' => ''],
            'blocks' => $blocks,
            'reason' => 'وصلتك الرسالة دي لأنك اتبرعت من خلال elyusr.org، وبنبلغك بكل خطوة في رحلة تبرعك.',
        ]];
    }

    public static function caseUpdate(string $name, string $title, string $excerpt, string $ref): array
    {
        return ["جديد عن «{$title}»", [
            'title' => 'جديد عن الحالة اللي دعمتها',
            'eyebrow' => $title,
            'blocks' => [
                ['type' => 'text', 'text' => '**' . self::first($name) . '**'],
                ['type' => 'text', 'text' => $excerpt !== '' ? $excerpt : 'أضفنا تحديث جديد على الحالة اللي ساهمت فيها.'],
                ['type' => 'button', 'label' => 'اقرأ التحديث', 'url' => '/cases/' . rawurlencode($ref)],
            ],
            'reason' => 'وصلتك الرسالة دي لأنك ساهمت في الحالة دي.',
        ]];
    }

    public static function volunteer(string $name): array
    {
        return ['استلمنا طلب تطوعك — شكرًا إنك معانا', [
            'title' => 'استلمنا طلب تطوعك',
            'eyebrow' => 'فريق اليسر',
            'hero' => ['image' => self::img('hero-volunteers'), 'alt' => 'فريق متطوعين اليسر'],
            'blocks' => [
                ['type' => 'text', 'text' => '**' . self::first($name) . '**'],
                ['type' => 'text', 'text' => 'شكرًا إنك قررت تدّي من وقتك. طلبك وصل لفريق التطوع، وهنتواصل معاك على رقمك خلال أيام لنحدد معاك المكان والوقت اللي يناسبك.'],
                ['type' => 'list', 'items' => ['توزيع كراتين الخير والأضاحي', 'زيارات ميدانية للأسر', 'تصوير وكتابة قصص الأثر', 'تنظيم الفعاليات والحملات']],
                ['type' => 'button', 'label' => 'شوف حملات التطوع', 'url' => '/volunteer', 'variant' => 'secondary'],
            ],
            'reason' => 'وصلتك الرسالة دي لأنك سجلت طلب تطوع على elyusr.org.',
        ]];
    }

    /* ───────────── newsletter ───────────── */

    public static function newsletterConfirm(string $link): array
    {
        return ['أكّد اشتراكك في نشرة اليسر', [
            'title' => 'خطوة واحدة وتبقى معانا',
            'eyebrow' => 'نشرة اليسر',
            'preheader' => 'اضغط «تأكيد الاشتراك» علشان توصلك أخبار الأثر.',
            'hero' => ['image' => self::img('hero-sprout'), 'alt' => ''],
            'blocks' => [
                ['type' => 'text', 'text' => 'أهلًا بيك! اضغط الزرار علشان تأكد اشتراكك في نشرة مؤسسة اليسر الخيرية.'],
                ['type' => 'list', 'items' => ['صور من التوزيع والحالات اللي اكتملت', 'الحملة الجاية قبل ما تتنشر', 'رسالة كل أسبوعين بالكتير، من غير إزعاج']],
                ['type' => 'button', 'label' => 'تأكيد الاشتراك', 'url' => $link],
                ['type' => 'note', 'text' => 'لو ما طلبتش الاشتراك، تجاهل الرسالة دي ومش هيوصلك مننا حاجة.'],
            ],
            'reason' => 'حد طلب اشتراك بالبريد ده في نشرة elyusr.org.',
        ]];
    }

    /* ───────────── misbaha ───────────── */

    public static function roomUrl($room): string
    {
        return '/misbaha/' . rawurlencode((string) $room->slug);
    }

    private static function n($v): string
    {
        return number_format((int) $v);
    }

    public static function misbahaConfirm($room, string $confirm, string $unsub): array
    {
        $name = trim((string) $room->name) ?: 'السبحة';

        return ["أكّد متابعتك لسبحة «{$name}»", [
            'title' => 'خطوة واحدة وتوصلك أخبار السبحة',
            'eyebrow' => 'المسبحة الإلكترونية',
            'hero' => ['image' => self::img('hero-misbaha'), 'alt' => 'المسبحة الإلكترونية', 'link' => self::roomUrl($room)],
            'blocks' => [
                ['type' => 'text', 'text' => "طلبت متابعة سبحة «**{$name}**». أكّد بالزرار، وهنبعتلك لما العداد يوصل للهدف، وملخص صغير كل جمعة بالعدد والدعاء."],
                ['type' => 'button', 'label' => 'تأكيد المتابعة', 'url' => $confirm],
                ['type' => 'stats', 'items' => array_values(array_filter([
                    ['value' => self::n($room->total_count), 'label' => 'ذكر لحد دلوقتي'],
                    $room->target_total ? ['value' => self::n($room->target_total), 'label' => 'الهدف'] : null,
                ]))],
                ['type' => 'note', 'text' => 'لو ما طلبتش المتابعة دي، تجاهل الرسالة ومش هيوصلك حاجة.'],
            ],
            'reason' => 'حد طلب متابعة سبحة بالبريد ده على elyusr.org.',
            'unsubscribe' => $unsub,
        ]];
    }

    public static function misbahaGoal($room, string $unsub): array
    {
        $name = trim((string) $room->name) ?: 'السبحة';

        return ["الحمد لله — «{$name}» وصلت للهدف 🎉", [
            'title' => 'وصلنا للهدف، الحمد لله',
            'eyebrow' => $name,
            'badge' => 'اكتمل الهدف',
            'hero' => ['image' => self::img('hero-misbaha'), 'alt' => '', 'link' => self::roomUrl($room)],
            'blocks' => [
                ['type' => 'text', 'text' => 'بفضل الله ثم بمشاركتك ومشاركة كل اللي سبّحوا، عداد «' . $name . '» وصل لـ**' . self::n($room->target_total) . '** ذكر.'],
                ['type' => 'stats', 'items' => [['value' => self::n($room->total_count), 'label' => 'ذكر'], ['value' => self::n($room->target_total), 'label' => 'الهدف']]],
                ['type' => 'quote', 'text' => 'اللهم تقبّل منا ومن كل من شارك، واجعله في ميزان حسناتهم.'],
                ['type' => 'button', 'label' => 'شارك السبحة واكمل', 'url' => self::roomUrl($room)],
                ['type' => 'heading', 'text' => 'خلّي الأجر يكمل بصدقة جارية'],
                ['type' => 'cards', 'items' => self::giveCards(2, (int) $room->id)],
            ],
            'reason' => 'وصلتك الرسالة دي لأنك اشتركت في متابعة السبحة دي.',
            'unsubscribe' => $unsub,
        ]];
    }

    public static function misbahaWeekly($room, int $week, string $unsub): array
    {
        $name = trim((string) $room->name) ?: 'السبحة';
        $left = $room->target_total ? max(0, (int) $room->target_total - (int) $room->total_count) : null;
        $duas = ['اللهم اجعل القرآن ربيع قلوبنا ونور صدورنا.', 'اللهم اغفر لنا ولوالدينا ولجميع المسلمين.', 'اللهم ارحم موتانا واشفِ مرضانا.', 'سبحان الله وبحمده، سبحان الله العظيم.'];

        return ["ملخص الجمعة: «{$name}» — " . self::n($room->total_count) . ' ذكر', [
            'title' => 'جمعة مباركة 🌿',
            'eyebrow' => 'ملخص سبحة «' . $name . '» الأسبوعي',
            'preheader' => self::n($week) . ' ذكر جديد الأسبوع ده.',
            'hero' => ['image' => self::img('hero-misbaha'), 'alt' => '', 'link' => self::roomUrl($room)],
            'blocks' => array_values(array_filter([
                ['type' => 'stats', 'items' => array_values(array_filter([
                    ['value' => self::n($week), 'label' => 'الأسبوع ده'],
                    ['value' => self::n($room->total_count), 'label' => 'الإجمالي'],
                    $left !== null ? ['value' => self::n($left), 'label' => 'باقي على الهدف'] : null,
                ]))],
                ['type' => 'quote', 'text' => $duas[(int) now()->weekOfYear % count($duas)]],
                ['type' => 'text', 'text' => 'ابعت السبحة لحد بتحبه، كل ذكر بيزوّد الأجر للكل.'],
                ['type' => 'button', 'label' => 'سبّح وشارك', 'url' => self::roomUrl($room)],
                ['type' => 'heading', 'text' => 'صدقة جارية بنفس النية'],
                ['type' => 'cards', 'items' => self::giveCards(2, (int) now()->weekOfYear)],
            ])),
            'reason' => 'وصلتك الرسالة دي لأنك اشتركت في الملخص الأسبوعي للسبحة دي.',
            'unsubscribe' => $unsub,
        ]];
    }

    /* ───────────── samples for the dashboard preview ───────────── */

    public static function sample(string $kind): ?array
    {
        $room = (object) ['id' => 1, 'slug' => 'example', 'name' => 'ختمة لروح الوالد', 'total_count' => 84250, 'target_total' => 100000];
        return match ($kind) {
            'code' => ['رمز تأكيد بريدك', ['title' => 'رمز تأكيد البريد', 'greeting' => 'أهلًا أحمد،', 'lines' => ['ده رمز تأكيد بريدك في موقع مؤسسة اليسر الخيرية:'], 'code' => '104787', 'after' => ['الرمز صالح لمدة 15 دقيقة.'], 'note' => 'لو ما طلبتش الرمز ده، تجاهل الرسالة وحسابك بأمان.']],
            'welcome' => self::welcome('أحمد محمد'),
            'receipt' => self::sampleDonation('receipt'),
            'delivery' => self::sampleDonation('delivery'),
            'failed' => self::sampleDonation('failed'),
            'case_update' => self::caseUpdate('أحمد', 'علاج الحاج محمود', 'الحمد لله العملية تمت بنجاح، والحاج محمود بيشكر كل اللي ساهموا.', 'AY-C-12'),
            'volunteer' => self::volunteer('سارة علي'),
            'newsletter_confirm' => self::newsletterConfirm(MailRenderer::site() . '/newsletter/confirm?token=example'),
            'misbaha_confirm' => self::misbahaConfirm($room, MailRenderer::site() . '/misbaha/confirm?token=example', MailRenderer::site() . '/misbaha/unsubscribe?token=example'),
            'misbaha_goal' => self::misbahaGoal($room, MailRenderer::site() . '/misbaha/unsubscribe?token=example'),
            'misbaha_weekly' => self::misbahaWeekly($room, 12500, MailRenderer::site() . '/misbaha/unsubscribe?token=example'),
            default => null,
        };
    }

    /** Sample donation emails without touching real data (a real paid donation's wording, made-up numbers). */
    private static function sampleDonation(string $kind): array
    {
        $d = new Donation();
        $d->forceFill(['id' => 42, 'amount' => 500, 'payment_method' => 'card', 'transaction_reference' => 'AY-2026-0042', 'status' => 'paid']);
        $d->created_at = now();
        $d->updated_at = now();
        $d->setRelation('donor', null);
        foreach (['program', 'donationCampaign', 'project', 'case'] as $rel) {
            $d->setRelation($rel, null);
        }

        return match ($kind) {
            'receipt' => self::receipt($d, 'أحمد محمد'),
            'failed' => self::failed($d, 'أحمد محمد'),
            default => self::delivery($d, 'أحمد محمد', 'delivered', null, []),
        };
    }
}
