<?php

namespace App\Support\Impact;

use App\Models\CaseModel;
use App\Models\DonationCampaign;
use App\Models\Program;
use App\Models\Project;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/** What a donation can go to (program / project / campaign / case): its column and a public card. */
final class Targets
{
    public const COLUMN = [
        'program' => 'program_id',
        'project' => 'project_id',
        'campaign' => 'donation_campaign_id',
        'case' => 'case_id',
    ];

    private const MODEL = [
        'program' => Program::class,
        'project' => Project::class,
        'campaign' => DonationCampaign::class,
        'case' => CaseModel::class,
    ];

    /** @var array<string, ?Model> */
    private static array $memo = [];

    public static function find(string $kind, string|int $key): ?Model
    {
        $class = self::MODEL[$kind] ?? null;
        if (! $class) {
            return null;
        }
        $memoKey = "{$kind}:{$key}";
        if (array_key_exists($memoKey, self::$memo)) {
            return self::$memo[$memoKey];
        }
        $q = $class::query();
        if (is_int($key) || ctype_digit((string) $key)) {
            $q->whereKey((int) $key);
        } elseif ($kind === 'case') {
            $q->where('code', $key);
        } else {
            $q->where('slug', $key);
        }

        return self::$memo[$memoKey] = $q->first();
    }

    /** { kind, id, slug, name, image, landing_slug? } — public fields only. */
    public static function card(string $kind, ?Model $m): ?array
    {
        if (! $m) {
            return null;
        }
        $a = $m->getAttributes();
        $image = $a['image'] ?? $a['cover_image'] ?? $a['image_url'] ?? null;
        if ($image && ! preg_match('#^https?://#i', $image)) {
            $image = Storage::disk('public')->url(ltrim(preg_replace('#^/?storage/#', '', $image), '/'));
        }

        return array_filter([
            'kind' => $kind,
            'id' => $m->getKey(),
            'slug' => $kind === 'case' ? ($a['code'] ?? null) : ($a['slug'] ?? null),
            'landing_slug' => $a['landing_slug'] ?? null,
            'name' => $a['name_ar'] ?? $a['title_ar'] ?? $a['title'] ?? $a['name'] ?? null,
            'image' => $image,
        ], fn ($v) => $v !== null && $v !== '');
    }
}
