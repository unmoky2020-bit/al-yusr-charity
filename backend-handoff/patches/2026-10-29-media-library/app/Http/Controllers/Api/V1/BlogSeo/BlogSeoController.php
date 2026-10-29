<?php

namespace App\Http\Controllers\Api\V1\BlogSeo;

use App\Http\Controllers\Controller;
use App\Http\Requests\BlogSeo\StoreBlogSeoRequest;
use App\Http\Requests\BlogSeo\UpdateBlogSeoRequest;
use App\Http\Resources\BlogSeo\BlogSeoResource;
use App\Models\BlogSeo;
use App\Models\Content;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BlogSeoController extends Controller
{
    private function calculateSeo(Content $content, array $data): array
    {
        $titleAr = trim((string) ($content->title_ar ?? ''));
        $titleEn = trim((string) ($content->title_en ?? ''));
        $summaryAr = trim((string) ($content->summary_ar ?? ''));
        $summaryEn = trim((string) ($content->summary_en ?? ''));

        $bodyAr = trim(strip_tags((string) ($content->content_ar ?? '')));
        $bodyEn = trim(strip_tags((string) ($content->content_en ?? '')));

        $wordsAr = preg_split('/\s+/u', $bodyAr, -1, PREG_SPLIT_NO_EMPTY);
        $wordsEn = preg_split('/\s+/u', $bodyEn, -1, PREG_SPLIT_NO_EMPTY);

        $wordCountAr = count($wordsAr);
        $wordCountEn = count($wordsEn);

        $titleLengthAr = mb_strlen($titleAr);
        $titleLengthEn = mb_strlen($titleEn);

        $descriptionLengthAr = mb_strlen($summaryAr);
        $descriptionLengthEn = mb_strlen($summaryEn);

        $score = 0;

        if ($wordCountAr >= 600) {
            $score += 25;
        } elseif ($wordCountAr >= 300) {
            $score += 15;
        } elseif ($wordCountAr >= 150) {
            $score += 8;
        }

        if ($titleLengthAr >= 30 && $titleLengthAr <= 70) {
            $score += 15;
        } elseif ($titleLengthAr > 0) {
            $score += 8;
        }

        if ($descriptionLengthAr >= 80 && $descriptionLengthAr <= 170) {
            $score += 15;
        } elseif ($descriptionLengthAr > 0) {
            $score += 8;
        }

        if (!empty($data['tags_ar']) || !empty($data['tags_en']) || !empty($content->tags)) {
            $score += 10;
        }

        if (!empty($data['og_image']) || !empty($data['og_image_url'])) {
            $score += 10;
        }

        if (!empty($data['category_ar']) || !empty($data['category_en'])) {
            $score += 5;
        }

        if (!empty($data['schema_data']) || !empty($data['schema_type'])) {
            $score += 10;
        }

        if (!empty($content->cover_image)) {
            $score += 10;
        }

        return [
            'seo_score' => min(100, $score),

            'word_count_ar' => $wordCountAr,
            'word_count_en' => $wordCountEn,

            'title_length_ar' => $titleLengthAr,
            'title_length_en' => $titleLengthEn,

            'description_length_ar' => $descriptionLengthAr,
            'description_length_en' => $descriptionLengthEn,

            'has_schema' => !empty($data['schema_data']) || !empty($data['schema_type']),
            'has_og' => !empty($data['og_image']) || !empty($data['og_image_url']),
            'has_category' => !empty($data['category_ar']) || !empty($data['category_en']),
            'has_tags' => !empty($data['tags_ar']) || !empty($data['tags_en']) || !empty($content->tags),
        ];
    }

    /**
     * Store an uploaded cover in the media library (media/blog) and return its storage path.
     */
    private function storeCover(Request $request): ?string
    {
        if (!$request->hasFile('cover_image')) {
            return null;
        }

        return $request->file('cover_image')->store('media/blog', 'public');
    }

    private function syncContentStatus(Content $content, string $workflowStatus): void
    {
        $status = match ($workflowStatus) {
            'published' => 'published',
            default => 'draft',
        };

        $content->update([
            'status' => $status,
        ]);
    }

    public function index(Request $request)
    {
        $query = BlogSeo::with(['content', 'content.author'])
            ->whereHas('content', fn ($q) => $q->where('type', 'article'));

        if ($request->filled('status')) {
            $query->where('workflow_status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->whereHas('content', function ($q) use ($search) {
                $q->where('title_ar', 'like', "%{$search}%")
                    ->orWhere('title_en', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $category = $request->category;

            $query->where(function ($q) use ($category) {
                $q->where('category_ar', 'like', "%{$category}%")
                    ->orWhere('category_en', 'like', "%{$category}%");
            });
        }

        if ($request->filled('min_score')) {
            $query->where('seo_score', '>=', (int) $request->min_score);
        }

        // id as a tie-breaker: posts with the same score must not shift between pages.
        $query->orderByDesc('seo_score')->orderByDesc('id');

        $perPage = min(max((int) $request->query('per_page', 20), 1), 100);

        return BlogSeoResource::collection($query->paginate($perPage));
    }

    public function show(BlogSeo $blogSeo)
    {
        return new BlogSeoResource(
            $blogSeo->load(['content', 'content.author'])
        );
    }

    public function store(StoreBlogSeoRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $data = $request->validated();

            if ($cover = $this->storeCover($request)) {
                $data['cover_image'] = $cover;
            }

            $workflowStatus = $data['workflow_status'] ?? 'draft';

            $content = Content::create([
                'type' => 'article',
                'status' => $workflowStatus === 'published' ? 'published' : 'draft',
                'slug' => $data['slug'],
                'title_ar' => $data['title_ar'],
                'title_en' => $data['title_en'] ?? null,
                'summary_ar' => $data['summary_ar'] ?? null,
                'summary_en' => $data['summary_en'] ?? null,
                'content_ar' => $data['content_ar'],
                'content_en' => $data['content_en'] ?? null,
                'cover_image' => $data['cover_image'] ?? null,
                'svg' => $data['svg'] ?? null,
                'tags' => $data['tags_ar'] ?? [],
                'author_id' => $data['author_id'] ?? $request->user()->id,
            ]);

            $seo = $this->calculateSeo($content, $data);

            $blogSeo = BlogSeo::create([
                ...collect($data)->except('cover_image')->all(),
                'content_id' => $content->id,
                'workflow_status' => $workflowStatus,
                'published_at' => $workflowStatus === 'published' ? now() : null,
                'created_by' => $request->user()->id,
                ...$seo,
            ]);

            return new BlogSeoResource(
                $blogSeo->load(['content', 'content.author'])
            );
        });
    }

    public function update(UpdateBlogSeoRequest $request, BlogSeo $blogSeo)
    {
        return DB::transaction(function () use ($request, $blogSeo) {
            $data = $request->validated();

            if ($cover = $this->storeCover($request)) {
                $data['cover_image'] = $cover;
            }

            $content = $blogSeo->content;

            $contentData = array_intersect_key($data, array_flip([
                'slug',
                'title_ar',
                'title_en',
                'summary_ar',
                'summary_en',
                'content_ar',
                'content_en',
                'cover_image',
                'svg',
                'author_id',
            ]));

            if (array_key_exists('tags_ar', $data)) {
                $contentData['tags'] = $data['tags_ar'];
            }

            if ($contentData) {
                $content->update($contentData);
            }

            $content->refresh();

            $workflowStatus = $data['workflow_status'] ?? $blogSeo->workflow_status;

            $seo = $this->calculateSeo(
                $content,
                array_merge($blogSeo->toArray(), $data)
            );

            $seoData = [
                ...collect($data)->except('cover_image')->all(),
                ...$seo,
                'updated_by' => $request->user()->id,
            ];

            if ($workflowStatus === 'published' && !$blogSeo->published_at) {
                $seoData['published_at'] = now();
            }

            if ($workflowStatus !== 'published') {
                $seoData['published_at'] = null;
            }

            $blogSeo->update($seoData);

            $this->syncContentStatus($content, $workflowStatus);

            return new BlogSeoResource(
                $blogSeo->fresh()->load(['content', 'content.author'])
            );
        });
    }

    public function destroy(BlogSeo $blogSeo)
    {
        return DB::transaction(function () use ($blogSeo) {
            $content = $blogSeo->content;

            $blogSeo->delete();

            if ($content) {
                $content->delete();
            }

            return response()->json([
                'message' => 'Deleted Successfully',
            ]);
        });
    }

    public function statistics()
    {
        $query = BlogSeo::whereHas(
            'content',
            fn ($q) => $q->where('type', 'article')
        );

        return response()->json([
            'total' => (clone $query)->count(),
            'published' => (clone $query)->where('workflow_status', 'published')->count(),
            'draft' => (clone $query)->where('workflow_status', 'draft')->count(),
            'review' => (clone $query)->where('workflow_status', 'review')->count(),
            'scheduled' => (clone $query)->where('workflow_status', 'scheduled')->count(),
            'archived' => (clone $query)->where('workflow_status', 'archived')->count(),
            'needs_improvement' => (clone $query)->where('seo_score', '<', 70)->count(),
            'excellent' => (clone $query)->where('seo_score', '>=', 90)->count(),
            'average_seo_score' => round(
                (float) ((clone $query)->avg('seo_score') ?? 0),
                2
            ),
        ]);
    }
}