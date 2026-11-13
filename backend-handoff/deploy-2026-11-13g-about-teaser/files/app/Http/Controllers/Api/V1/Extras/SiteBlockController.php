<?php

namespace App\Http\Controllers\Api\V1\Extras;

use App\Http\Controllers\Controller;
use App\Models\Extras\SiteBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

/**
 * Editable site-wide blocks (the site falls back to its built-in copy when a block is missing):
 *   GET /site-blocks                 public: {org_info: {...}, about_milestones: [...], nav_links: {...}}
 *   PUT /admin/site-blocks/{key}     body: {value: …}   (permission settings.update)
 *   DELETE /admin/site-blocks/{key}  back to the built-in copy
 * Every value is checked against a small schema below: only known keys, strings / short lists.
 */
class SiteBlockController extends Controller
{
    private const CACHE_KEY = 'extras.site_blocks.v1';

    public const KEYS = ['org_info', 'about_milestones', 'nav_links', 'seo_progress', 'about_teaser'];

    public function index(): JsonResponse
    {
        $all = Cache::remember(self::CACHE_KEY, 300, fn () => SiteBlock::query()
            ->whereIn('key', self::KEYS)->get()
            ->mapWithKeys(fn (SiteBlock $b) => [$b->key => $b->value])->all());

        return response()->json(['data' => (object) $all]);
    }

    public function update(Request $request, string $key): JsonResponse
    {
        abort_unless(in_array($key, self::KEYS, true), 404, 'القسم ده مش موجود.');
        $value = $request->input('value');
        $clean = match ($key) {
            'org_info' => $this->orgInfo($value),
            'about_milestones' => $this->milestones($value),
            'nav_links' => $this->navLinks($value),
            'seo_progress' => $this->seoProgress($value),
            'about_teaser' => $this->aboutTeaser($value),
        };

        SiteBlock::updateOrCreate(['key' => $key], ['value' => $clean, 'updated_by' => optional($request->user())->id]);
        Cache::forget(self::CACHE_KEY);

        return response()->json(['data' => [$key => $clean]]);
    }

    public function destroy(string $key): JsonResponse
    {
        abort_unless(in_array($key, self::KEYS, true), 404, 'القسم ده مش موجود.');
        SiteBlock::where('key', $key)->delete();
        Cache::forget(self::CACHE_KEY);

        return response()->json(['data' => [$key => null]]);
    }

    // ── Schemas ──────────────────────────────────────────────────────────────

    private const ORG_FIELDS = [
        'name_ar', 'name_en', 'phone', 'phone_display', 'whatsapp', 'email', 'address_ar', 'address_en',
        'hours_ar', 'hours_en', 'license_ar', 'license_en', 'facebook', 'instagram', 'youtube', 'tiktok',
        'x', 'linkedin', 'maps_url', 'review_url',
    ];

    private function orgInfo(mixed $v): array
    {
        $this->expect(is_array($v), 'value', 'لازم تكون بيانات.');
        $out = [];
        foreach (self::ORG_FIELDS as $f) {
            if (! array_key_exists($f, $v) || $v[$f] === null || $v[$f] === '') {
                continue;
            }
            $this->expect(is_string($v[$f]) && mb_strlen($v[$f]) <= 500, "value.$f", 'نص أطول من المسموح.');
            if (in_array($f, ['facebook', 'instagram', 'youtube', 'tiktok', 'x', 'linkedin', 'maps_url', 'review_url'], true)) {
                $this->expect(str_starts_with($v[$f], 'https://'), "value.$f", 'الرابط لازم يبدأ بـ https://');
            }
            if ($f === 'email') {
                $this->expect((bool) filter_var($v[$f], FILTER_VALIDATE_EMAIL), "value.$f", 'البريد مش صحيح.');
            }
            $out[$f] = trim($v[$f]);
        }

        return $out;
    }

    private function milestones(mixed $v): array
    {
        $this->expect(is_array($v) && array_is_list($v) && count($v) <= 30, 'value', 'لازم تكون قائمة (30 بالكتير).');
        $out = [];
        foreach ($v as $i => $m) {
            $this->expect(is_array($m), "value.$i", 'محطة مش صحيحة.');
            $year = trim((string) ($m['year'] ?? ''));
            $titleAr = trim((string) ($m['title_ar'] ?? ''));
            $this->expect($year !== '' && mb_strlen($year) <= 20, "value.$i.year", 'اكتب السنة.');
            $this->expect($titleAr !== '' && mb_strlen($titleAr) <= 200, "value.$i.title_ar", 'اكتب العنوان بالعربي.');
            $row = ['year' => $year, 'title_ar' => $titleAr];
            foreach (['title_en' => 200, 'text_ar' => 1500, 'text_en' => 1500] as $f => $max) {
                $s = trim((string) ($m[$f] ?? ''));
                $this->expect(mb_strlen($s) <= $max, "value.$i.$f", 'نص أطول من المسموح.');
                if ($s !== '') {
                    $row[$f] = $s;
                }
            }
            $out[] = $row;
        }

        return $out;
    }

    private function navLinks(mixed $v): array
    {
        $this->expect(is_array($v), 'value', 'لازم تكون بيانات.');
        $out = [];
        foreach (['header', 'footer'] as $group) {
            if (! isset($v[$group])) {
                continue;
            }
            $list = $v[$group];
            $this->expect(is_array($list) && array_is_list($list) && count($list) <= 40, "value.$group", 'قائمة مش صحيحة.');
            $out[$group] = [];
            foreach ($list as $i => $l) {
                $this->expect(is_array($l), "value.$group.$i", 'رابط مش صحيح.');
                $href = trim((string) ($l['href'] ?? ''));
                $label = trim((string) ($l['label_ar'] ?? ''));
                $this->expect($label !== '' && mb_strlen($label) <= 80, "value.$group.$i.label_ar", 'اكتب اسم الرابط.');
                $this->expect(preg_match('#^(/(?!/)[^\s]*|https://[^\s]+)$#', $href) === 1, "value.$group.$i.href", 'الرابط لازم يبدأ بـ / أو https://');
                $row = ['label_ar' => $label, 'href' => $href];
                $en = trim((string) ($l['label_en'] ?? ''));
                if ($en !== '') {
                    $row['label_en'] = mb_substr($en, 0, 80);
                }
                if ($group === 'footer') {
                    $col = (string) ($l['column'] ?? 'quick');
                    $this->expect(in_array($col, ['quick', 'campaigns'], true), "value.$group.$i.column", 'العمود لازم يكون quick أو campaigns.');
                    $row['column'] = $col;
                }
                $out[$group][] = $row;
            }
        }

        return $out;
    }

    /**
     * The SEO map: keyword → {pos (Google position, null = not in the top 100), date, page, note}.
     * Only what the team typed in the dashboard; the keyword list itself lives in docs/seo-keywords.csv.
     */
    private function seoProgress(mixed $v): array
    {
        $this->expect(is_array($v) && ! array_is_list($v) && count($v) <= 1500, 'value', 'لازم تكون خريطة كلمات (1500 بالكتير).');
        $out = [];
        foreach ($v as $kw => $e) {
            $kw = trim((string) $kw);
            if ($kw === '' || mb_strlen($kw) > 120 || ! is_array($e)) {
                continue;
            }
            $row = [];
            if (isset($e['pos']) && $e['pos'] !== null && $e['pos'] !== '') {
                $this->expect(is_numeric($e['pos']) && (int) $e['pos'] >= 1 && (int) $e['pos'] <= 100, "value.$kw.pos", 'الترتيب لازم يكون من 1 لـ 100.');
                $row['pos'] = (int) $e['pos'];
            } else {
                $row['pos'] = null;
            }
            $date = trim((string) ($e['date'] ?? ''));
            if ($date !== '') {
                $this->expect((bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $date), "value.$kw.date", 'التاريخ لازم يكون YYYY-MM-DD.');
                $row['date'] = $date;
            }
            foreach (['page' => 300, 'note' => 300] as $f => $max) {
                $s = trim((string) ($e[$f] ?? ''));
                if ($s !== '') {
                    $row[$f] = mb_substr($s, 0, $max);
                }
            }
            $out[$kw] = $row;
        }

        return $out;
    }

    /** The home page's «من نحن» section: heading, paragraph and up to 4 stops (year optional). */
    private function aboutTeaser(mixed $v): array
    {
        $this->expect(is_array($v), 'value', 'لازم تكون بيانات.');
        $out = [];
        foreach (['title_ar' => 200, 'title_en' => 200, 'text_ar' => 1500, 'text_en' => 1500] as $f => $max) {
            $s = trim((string) ($v[$f] ?? ''));
            $this->expect(mb_strlen($s) <= $max, "value.$f", 'نص أطول من المسموح.');
            if ($s !== '') {
                $out[$f] = $s;
            }
        }
        $stops = $v['stops'] ?? [];
        $this->expect(is_array($stops) && array_is_list($stops) && count($stops) <= 4, 'value.stops', 'المحطات 4 بالكتير.');
        $out['stops'] = [];
        foreach ($stops as $i => $m) {
            $this->expect(is_array($m), "value.stops.$i", 'محطة مش صحيحة.');
            $title = trim((string) ($m['title_ar'] ?? ''));
            $this->expect($title !== '' && mb_strlen($title) <= 200, "value.stops.$i.title_ar", 'اكتب عنوان المحطة بالعربي.');
            $row = ['title_ar' => $title];
            foreach (['year' => 20, 'title_en' => 200, 'text_ar' => 600, 'text_en' => 600] as $f => $max) {
                $s = trim((string) ($m[$f] ?? ''));
                $this->expect(mb_strlen($s) <= $max, "value.stops.$i.$f", 'نص أطول من المسموح.');
                if ($s !== '') {
                    $row[$f] = $s;
                }
            }
            $out['stops'][] = $row;
        }

        return $out;
    }

    private function expect(bool $ok, string $field, string $message): void
    {
        if (! $ok) {
            throw ValidationException::withMessages([$field => $message]);
        }
    }
}
