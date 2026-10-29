<?php

namespace App\Http\Controllers\Api\V1\Seo;

use App\Http\Controllers\Controller;
use App\Models\Axis;
use App\Models\CaseModel;
use App\Models\Content;
use App\Models\Program;
use App\Models\Story;
use App\Support\PublicUrls;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * GET /api/v1/seo/page?path=/cases/CASE-1234&lang=ar
 *
 * Everything a crawler or a social preview needs for one public page — title, description, image,
 * canonical, JSON-LD and a short readable summary — built from the database. The website's PHP
 * front (elyusr.org/seo.php) injects it into index.html, so links shared on WhatsApp / Facebook / X
 * and pages read by Google or AI assistants show the real content without running JavaScript.
 * 404 when the path is not a public record (the website then keeps its default tags).
 */
class SeoPageController extends Controller
{
    private const ORG_AR = 'مؤسسة اليسر الخيرية';
    private const ORG_EN = 'Al-Yusr Charity Foundation';

    public function __invoke(Request $request): JsonResponse
    {
        $path = '/' . trim((string) $request->query('path', ''), '/');
        $lang = $request->query('lang') === 'en' ? 'en' : 'ar';

        $page = Cache::remember("seo-page:{$lang}:{$path}", now()->addMinutes(5), fn () => $this->build($path, $lang) ?? false);
        if (! $page) {
            return response()->json(['message' => 'Not a public page.'], 404);
        }

        return response()->json(['data' => $page])->header('Cache-Control', 'public, max-age=300');
    }

    private function build(string $path, string $lang): ?array
    {
        if (! preg_match('#^/(cases|programs|axes|stories|blog)/([^/]+)$#', $path, $m)) {
            return null;
        }
        $key = urldecode($m[2]);

        return match ($m[1]) {
            'cases' => $this->casePage(CaseModel::query()->where('code', $key)->first(), $lang),
            'programs' => $this->programPage(Program::query()->where('slug', $key)->first(), $lang),
            'axes' => $this->axisPage(Axis::query()->where('slug', $key)->first(), $lang),
            'stories' => $this->storyPage(Story::query()->where('slug', $key)->first(), $lang),
            'blog' => $this->articlePage(Content::query()->where('type', 'article')->where('slug', $key)->first(), $lang),
        };
    }

    private function casePage(?CaseModel $c, string $lang): ?array
    {
        if (! $c || ! PublicUrls::pathOf($c)) {
            return null;
        }
        $target = (float) $c->target_amount;
        $collected = (float) $c->donations()->where('status', 'paid')->sum('amount');
        $remaining = max(0, $target - $collected);
        $place = collect([$c->city, $c->governorate])->filter()->implode('، ');
        $needAr = $remaining > 0 ? 'مطلوب ' . number_format($remaining) . ' ج.م لإكمال الحالة' : 'اكتمل تمويل الحالة';
        $needEn = $remaining > 0 ? number_format($remaining) . ' EGP still needed' : 'Fully funded';
        $story = $this->plain($c->description);

        $title = $lang === 'en'
            ? Str::limit($c->title, 50, '…') . ' | Urgent case — ' . self::ORG_EN
            : Str::limit($c->title, 45, '…') . ' | حالة عاجلة — اليسر';
        $description = $lang === 'en'
            ? "{$needEn}. " . Str::limit($story, 120)
            : "{$needAr}" . ($place ? " — {$place}" : '') . '. ' . Str::limit($story, 110);

        $url = PublicUrls::site(PublicUrls::pathOf($c));

        return [
            'type' => 'article',
            'title' => $title,
            'description' => $description,
            'image' => $this->image($c->cover_image),
            'h1' => $c->title,
            'summary' => $story,
            'facts' => array_filter([
                ($lang === 'en' ? 'Case code' : 'كود الحالة') => $c->code,
                ($lang === 'en' ? 'Location' : 'المكان') => $place ?: null,
                ($lang === 'en' ? 'Goal' : 'المبلغ المطلوب') => number_format($target) . ($lang === 'en' ? ' EGP' : ' ج.م'),
                ($lang === 'en' ? 'Raised' : 'تم جمع') => number_format($collected) . ($lang === 'en' ? ' EGP' : ' ج.م'),
                ($lang === 'en' ? 'Remaining' : 'المتبقي') => number_format($remaining) . ($lang === 'en' ? ' EGP' : ' ج.م'),
            ]),
            'donate_url' => PublicUrls::site('/donate?case=' . rawurlencode($c->code)),
            'jsonld' => [
                $this->breadcrumbs($lang, [[$lang === 'en' ? 'Cases' : 'الحالات', '/cases'], [$c->title, PublicUrls::pathOf($c)]]),
                [
                    '@context' => 'https://schema.org',
                    '@type' => 'WebPage',
                    'url' => $url,
                    'name' => $c->title,
                    'description' => $description,
                    'image' => $this->image($c->cover_image),
                    'dateModified' => optional($c->updated_at)->toIso8601String(),
                    'publisher' => $this->org($lang),
                    'potentialAction' => [
                        '@type' => 'DonateAction',
                        'target' => PublicUrls::site('/donate?case=' . rawurlencode($c->code)),
                        'recipient' => $this->org($lang),
                        'priceSpecification' => ['@type' => 'PriceSpecification', 'priceCurrency' => 'EGP', 'price' => $remaining],
                    ],
                ],
            ],
        ];
    }

    private function programPage(?Program $p, string $lang): ?array
    {
        if (! $p || ! PublicUrls::pathOf($p) || $p->noindex) {
            return null;
        }
        $name = $this->pick($lang, $p->name_ar ?: $p->name, $p->name_en);
        $description = $this->pick($lang, $p->meta_description_ar, $p->meta_description_en)
            ?: $this->pick($lang, $p->tagline_ar, $p->tagline_en)
            ?: Str::limit($this->plain($this->pick($lang, $p->description_ar ?: $p->description, $p->description_en)), 155);

        return [
            'type' => 'website',
            'title' => $this->pick($lang, $p->meta_title_ar, $p->meta_title_en) ?: $name . ' | ' . ($lang === 'en' ? self::ORG_EN : self::ORG_AR),
            'description' => $description,
            'image' => $this->image($p->og_image ?: $p->image ?: $p->cover_image ?: $p->hero_image),
            'h1' => $name,
            'summary' => $this->plain($this->pick($lang, $p->ai_summary_ar, $p->ai_summary_en) ?: $this->pick($lang, $p->description_ar ?: $p->description, $p->description_en)),
            'facts' => [],
            'donate_url' => PublicUrls::site('/donate?program=' . rawurlencode($p->slug)),
            'jsonld' => [$this->breadcrumbs($lang, [[$lang === 'en' ? 'Programs' : 'البرامج', '/programs'], [$name, PublicUrls::pathOf($p)]])],
        ];
    }

    private function axisPage(?Axis $a, string $lang): ?array
    {
        if (! $a || ! PublicUrls::pathOf($a)) {
            return null;
        }
        $name = $this->pick($lang, $a->name_ar, $a->name_en);
        $text = $this->plain($this->pick($lang, $a->description_ar, $a->description_en));

        return [
            'type' => 'website',
            'title' => $name . ' | ' . ($lang === 'en' ? self::ORG_EN : self::ORG_AR),
            'description' => Str::limit($text, 155),
            'image' => $this->image($a->image),
            'h1' => $name,
            'summary' => $text,
            'facts' => [],
            'donate_url' => PublicUrls::site('/donate'),
            'jsonld' => [$this->breadcrumbs($lang, [[$name, PublicUrls::pathOf($a)]])],
        ];
    }

    private function storyPage(?Story $s, string $lang): ?array
    {
        if (! $s || ! PublicUrls::pathOf($s)) {
            return null;
        }
        $title = $this->pick($lang, $s->title_ar, $s->title_en);
        $text = $this->plain($this->pick($lang, $s->description_ar, $s->description_en));

        return [
            'type' => 'article',
            'title' => $title . ' | ' . ($lang === 'en' ? 'Stories — ' . self::ORG_EN : 'قصص الأثر — اليسر'),
            'description' => Str::limit($text, 155),
            'image' => $this->image($s->cover_image_url ?: $s->cover_image),
            'h1' => $title,
            'summary' => $text,
            'facts' => [],
            'donate_url' => PublicUrls::site('/donate'),
            'jsonld' => [$this->breadcrumbs($lang, [[$lang === 'en' ? 'Stories' : 'القصص', '/stories'], [$title, PublicUrls::pathOf($s)]])],
        ];
    }

    private function articlePage(?Content $a, string $lang): ?array
    {
        if (! $a || ! PublicUrls::pathOf($a)) {
            return null;
        }
        $title = $this->pick($lang, $a->title_ar, $a->title_en);
        $summary = $this->plain($this->pick($lang, $a->summary_ar, $a->summary_en)) ?: Str::limit($this->plain($this->pick($lang, $a->content_ar, $a->content_en)), 300);
        $image = $this->image($a->cover_image);
        $url = PublicUrls::site(PublicUrls::pathOf($a));

        return [
            'type' => 'article',
            'title' => $title . ' | ' . ($lang === 'en' ? 'Al-Yusr Blog' : 'مدونة اليسر'),
            'description' => Str::limit($summary, 155),
            'image' => $image,
            'h1' => $title,
            'summary' => $summary,
            'facts' => [],
            'donate_url' => PublicUrls::site('/donate'),
            'jsonld' => [
                $this->breadcrumbs($lang, [[$lang === 'en' ? 'Blog' : 'المدونة', '/blog'], [$title, PublicUrls::pathOf($a)]]),
                [
                    '@context' => 'https://schema.org',
                    '@type' => 'Article',
                    'headline' => Str::limit($title, 110, ''),
                    'description' => Str::limit($summary, 155),
                    'image' => $image,
                    'mainEntityOfPage' => $url,
                    'datePublished' => optional($a->created_at)->toIso8601String(),
                    'dateModified' => optional($a->updated_at)->toIso8601String(),
                    'author' => $this->org($lang),
                    'publisher' => $this->org($lang),
                ],
            ],
        ];
    }

    /* ───────────── helpers ───────────── */

    private function pick(string $lang, ?string $ar, ?string $en): string
    {
        return trim((string) ($lang === 'en' ? ($en ?: $ar) : ($ar ?: $en)));
    }

    private function plain(?string $html): string
    {
        $text = html_entity_decode(strip_tags((string) $html), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim(preg_replace('/\s+/u', ' ', $text));
    }

    private function image(?string $v): ?string
    {
        $v = trim((string) $v);
        if ($v === '') {
            return null;
        }
        if (preg_match('#^https?://#', $v)) {
            return $v;
        }
        $v = ltrim($v, '/');

        return url(str_starts_with($v, 'storage/') ? $v : 'storage/' . $v);
    }

    private function org(string $lang): array
    {
        return ['@type' => 'NGO', 'name' => $lang === 'en' ? self::ORG_EN : self::ORG_AR, 'url' => PublicUrls::site('/')];
    }

    /** @param array<int, array{0: string, 1: string}> $items [name, path] after «Home» */
    private function breadcrumbs(string $lang, array $items): array
    {
        $all = array_merge([[$lang === 'en' ? 'Home' : 'الرئيسية', '/']], $items);

        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => array_map(fn ($it, $i) => [
                '@type' => 'ListItem',
                'position' => $i + 1,
                'name' => $it[0],
                'item' => PublicUrls::site($it[1]),
            ], $all, array_keys($all)),
        ];
    }
}
