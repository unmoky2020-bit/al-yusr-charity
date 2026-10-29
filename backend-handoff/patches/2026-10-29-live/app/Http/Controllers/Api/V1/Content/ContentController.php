<?php

namespace App\Http\Controllers\Api\V1\Content;

use App\Http\Controllers\Controller;
use App\Http\Requests\Content\StoreContentRequest;
use App\Http\Requests\Content\UpdateContentRequest;
use App\Http\Resources\ContentResource;
use App\Models\Content;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ContentController extends Controller
{
    public function index(Request $request)
    {
        $query = Content::with('author')->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('title_ar', 'like', "%{$search}%")
                    ->orWhere('title_en', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        return ContentResource::collection(
            $query->paginate(\App\Support\PerPage::from(request(), 12))
        );
    }

    public function store(StoreContentRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request
                ->file('cover_image')
                ->store('contents', 'public');
        }

        $data['author_id'] = $data['author_id']
            ?? $request->user()->id;

        $content = Content::create($data);

        return new ContentResource(
            $content->load('author')
        );
    }

    public function show(Content $content)
    {
        return new ContentResource(
            $content->load('author')
        );
    }

    public function update(
        UpdateContentRequest $request,
        Content $content
    ) {
        $data = $request->validated();

        if ($request->hasFile('cover_image')) {
            if ($content->cover_image) {
                Storage::disk('public')
                    ->delete($content->cover_image);
            }

            $data['cover_image'] = $request
                ->file('cover_image')
                ->store('contents', 'public');
        }

        $content->update($data);

        return new ContentResource(
            $content->fresh()->load('author')
        );
    }

    public function destroy(Content $content)
    {
        if ($content->cover_image) {
            Storage::disk('public')
                ->delete($content->cover_image);
        }

        $content->delete();

        return response()->json([
            'message' => 'Content deleted successfully',
        ]);
    }

    public function statistics()
    {
        return response()->json([
            'total' => Content::count(),
            'published' => Content::where('status', 'published')->count(),
            'drafts' => Content::where('status', 'draft')->count(),

            'articles' => Content::where('type', 'article')->count(),
            'programs' => Content::where('type', 'program')->count(),
            'faqs' => Content::where('type', 'faq')->count(),
            'pages' => Content::where('type', 'page')->count(),
        ]);
    }
}
