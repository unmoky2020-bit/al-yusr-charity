<?php

namespace App\Http\Controllers\Api\V1\Service;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Support\Viewer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Service pages, addressed by slug (the public URL /services/{slug}):
 *   GET    /services            public: active, by sort_order   (?all=1 for staff: also inactive)
 *   GET    /services/{slug}     public: one active service       (staff also see inactive)
 *   POST   /services            staff
 *   PUT    /services/{slug}     staff, partial body
 *   DELETE /services/{slug}     staff
 *   POST   /services/reorder    staff { slugs: [] }
 *   GET    /service-categories  public
 * Field names follow the dashboard (hero_image, intro_*, meta_*); they map onto the table's columns.
 */
class ServiceController extends Controller
{
    /** API name → column. */
    private const ALIASES = [
        'hero_image' => 'image_url',
        'intro_ar' => 'short_intro_ar',
        'intro_en' => 'short_intro_en',
        'meta_title_ar' => 'seo_title_ar',
        'meta_title_en' => 'seo_title_en',
        'meta_description_ar' => 'seo_description_ar',
        'meta_description_en' => 'seo_description_en',
    ];

    public function index(Request $request): JsonResponse
    {
        $all = $request->boolean('all') && Viewer::isStaff($request);
        $services = Service::query()
            ->when(! $all, fn ($q) => $q->where('is_active', true))
            ->orderBy('sort_order')->orderBy('id')
            ->get();

        return response()->json(['data' => $services->map(fn (Service $s) => $this->present($s))->values()]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $service = Service::query()->where('slug', $slug)
            ->when(! Viewer::isStaff($request), fn ($q) => $q->where('is_active', true))
            ->firstOrFail();

        return response()->json(['data' => $this->present($service)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $service = Service::create($data + ['sort_order' => (int) Service::max('sort_order') + 1, 'is_active' => $data['is_active'] ?? true]);

        return response()->json(['data' => $this->present($service)], 201);
    }

    public function update(Request $request, string $slug): JsonResponse
    {
        $service = Service::query()->where('slug', $slug)->firstOrFail();
        $service->update($this->validated($request, $service));

        return response()->json(['data' => $this->present($service->fresh())]);
    }

    public function destroy(string $slug): JsonResponse
    {
        Service::query()->where('slug', $slug)->firstOrFail()->delete();

        return response()->json(['message' => 'تم الحذف']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $slugs = $request->validate(['slugs' => ['required', 'array'], 'slugs.*' => ['string']])['slugs'];
        foreach (array_values($slugs) as $i => $slug) {
            Service::query()->where('slug', $slug)->update(['sort_order' => $i + 1]);
        }

        return response()->json(['message' => 'تم الترتيب']);
    }

    public function categories(): JsonResponse
    {
        return response()->json(['data' => ServiceCategory::query()->where('is_active', true)->orderBy('sort_order')->get()]);
    }

    /* ───────────── helpers ───────────── */

    private function validated(Request $request, ?Service $current = null): array
    {
        foreach (self::ALIASES as $api => $column) {
            if ($request->has($api) && ! $request->has($column)) {
                $request->merge([$column => $request->input($api)]);
            }
        }
        $req = $current ? 'sometimes' : 'required';

        $data = $request->validate([
            'slug' => [$req, 'string', 'max:120', 'regex:/^[a-z0-9-]+$/', Rule::unique('services', 'slug')->ignore($current?->id)],
            'title_ar' => [$req, 'string', 'max:255'],
            'title_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'program_slug' => ['sometimes', 'nullable', 'string', 'max:120'],
            'sector' => ['sometimes', 'nullable', 'string', 'max:60'],
            'service_category_id' => ['sometimes', 'nullable', 'integer', 'exists:service_categories,id'],
            'badge_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'badge_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'image_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'short_intro_ar' => ['sometimes', 'nullable', 'string'],
            'short_intro_en' => ['sometimes', 'nullable', 'string'],
            'seo_title_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'seo_title_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'seo_description_ar' => ['sometimes', 'nullable', 'string', 'max:500'],
            'seo_description_en' => ['sometimes', 'nullable', 'string', 'max:500'],
            'bullets_ar' => ['sometimes', 'nullable', 'array'],
            'bullets_en' => ['sometimes', 'nullable', 'array'],
            'stats' => ['sometimes', 'nullable', 'array'],
            'features' => ['sometimes', 'nullable', 'array'],
            'tiers' => ['sometimes', 'nullable', 'array'],
            'related' => ['sometimes', 'nullable', 'array'],
            'sort_order' => ['sometimes', 'integer'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // Every service belongs to a category (required column): the one whose slug is the sector,
        // else the general «all sectors» category.
        if (! $current && empty($data['service_category_id'])) {
            $data['service_category_id'] = $this->categoryFor($data['sector'] ?? null);
        }

        return $data;
    }

    private function categoryFor(?string $sector): ?int
    {
        $bySector = $sector ? ServiceCategory::query()->where('slug', $sector)->value('id') : null;

        return $bySector
            ?? ServiceCategory::query()->where('slug', 'all-sectors')->value('id')
            ?? ServiceCategory::query()->orderBy('sort_order')->value('id');
    }

    private function present(Service $s): array
    {
        return [
            'id' => $s->id,
            'slug' => $s->slug,
            'program_slug' => $s->program_slug,
            'sector' => $s->sector,
            'service_category_id' => $s->service_category_id,
            'title_ar' => $s->title_ar,
            'title_en' => $s->title_en,
            'badge_ar' => $s->badge_ar,
            'badge_en' => $s->badge_en,
            'hero_image' => $s->image_url,
            'intro_ar' => $s->short_intro_ar,
            'intro_en' => $s->short_intro_en,
            'meta_title_ar' => $s->seo_title_ar,
            'meta_title_en' => $s->seo_title_en,
            'meta_description_ar' => $s->seo_description_ar,
            'meta_description_en' => $s->seo_description_en,
            'bullets_ar' => $s->bullets_ar ?? [],
            'bullets_en' => $s->bullets_en ?? [],
            'stats' => $s->stats ?? [],
            'features' => $s->features ?? [],
            'tiers' => $s->tiers ?? [],
            'related' => $s->related ?? [],
            'sort_order' => $s->sort_order,
            'is_active' => $s->is_active,
            'updated_at' => optional($s->updated_at)->toIso8601String(),
        ];
    }
}
