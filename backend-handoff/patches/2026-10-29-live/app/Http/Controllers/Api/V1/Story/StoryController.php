<?php

namespace App\Http\Controllers\Api\V1\Story;

use App\Http\Controllers\Controller;
use App\Http\Requests\Story\StoreStoryRequest;
use App\Http\Requests\Story\UpdateStoryRequest;
use App\Http\Resources\Story\StoryResource;
use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Story::query()
            ->latest('sort_order')
            ->latest();

        // Visitors only ever get published stories (drafts stay in the dashboard).
        // Staff: ?status=<value> filters, "all" or nothing = every status.
        if (! \App\Support\Viewer::isStaff($request)) {
            $query->where('status', 'published');
        } elseif ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('is_featured')) {
            $query->where(
                'is_featured',
                filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN)
            );
        }

        if ($request->filled('category')) {
            $query->where(function ($q) use ($request) {
                $q->where('category_ar', $request->category)
                  ->orWhere('category_en', $request->category);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('title_ar', 'like', "%{$search}%")
                  ->orWhere('title_en', 'like', "%{$search}%")
                  ->orWhere('beneficiary_name', 'like', "%{$search}%")
                  ->orWhere('location_ar', 'like', "%{$search}%")
                  ->orWhere('location_en', 'like', "%{$search}%");
            });
        }

        return StoryResource::collection($query->paginate(\App\Support\PerPage::from(request(), 15)));
    }

    public function statistics()
    {
        return response()->json([
            'total' => Story::count(),
            'published' => Story::where('status', 'published')->count(),
            'drafts' => Story::where('status', 'draft')->count(),
            'featured' => Story::where('is_featured', true)->count(),
        ]);
    }

    public function store(StoreStoryRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('cover_image')) {
            $data['cover_image'] =
                $request->file('cover_image')->store('stories', 'public');
        }

        $data['created_by'] = $request->user()->id;

        return new StoryResource(
            Story::create($data)
        );
    }

    public function show(Story $story)
    {
        return new StoryResource($story);
    }

    public function update(UpdateStoryRequest $request, Story $story)
    {
        $data = $request->validated();

        if ($request->hasFile('cover_image')) {
            if ($story->cover_image) {
                Storage::disk('public')->delete($story->cover_image);
            }

            $data['cover_image'] =
                $request->file('cover_image')->store('stories', 'public');
        }

        $story->update($data);

        return new StoryResource($story->fresh());
    }

    public function destroy(Story $story)
    {
        if ($story->cover_image) {
            Storage::disk('public')->delete($story->cover_image);
        }

        $story->delete();

        return response()->json([
            'message' => 'Story deleted successfully',
        ]);
    }
}
