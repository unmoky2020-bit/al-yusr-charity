<?php

namespace App\Http\Controllers\Api\V1\Project;
use Illuminate\Support\Facades\Storage;
use App\Models\Project;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Services\ActivityLogService;
use App\Support\Viewer;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::with(['donationPackages', 'cases'])->latest();

        // Visitors only see active projects that are not hidden; the team sees everything.
        if (!Viewer::isStaff($request)) {
            $query->where('is_active', true)->where('hide_from_audience', false);
        }

        return ProjectResource::collection(
            $query->paginate(\App\Support\PerPage::from($request, 10))
        );
    }

    /** GET /projects/by-slug/{slug} — the public landing pages look projects up by slug. */
    public function showBySlug(Request $request, string $slug)
    {
        $query = Project::with(['donationPackages', 'cases'])->where('slug', $slug);
        if (!Viewer::isStaff($request)) {
            $query->where('is_active', true)->where('hide_from_audience', false);
        }

        return new ProjectResource($query->firstOrFail());
    }

  
public function store(StoreProjectRequest $request)
{
    $data = $request->validated();

    if ($request->hasFile('cover_image')) {
        $data['cover_image'] = $request->file('cover_image')
            ->store('projects', 'public');
    }

    $project = Project::create($data);

    app(ActivityLogService::class)->created(
        $project,
        'إنشاء مشروع جديد: ' . ($project->name ?? 'Project'),
        [
            'attributes' => $data,
        ]
    );

    return new ProjectResource($project);
}


    public function show(Request $request, Project $project)
    {
        if (!Viewer::isStaff($request) && (!$project->is_active || $project->hide_from_audience)) {
            abort(404);
        }
        $project->load(['donationPackages', 'cases']);

        return new ProjectResource($project);
    }
    
    
public function update(UpdateProjectRequest $request, Project $project)
{
    $oldData = $project->toArray();
    $data = $request->validated();

    $oldImage = $project->cover_image;

    if ($request->hasFile('cover_image')) {
        $data['cover_image'] = $request->file('cover_image')
            ->store('projects', 'public');
    }

    $project->update($data);

    // Only files this project uploaded (projects/...) are removed; media-library files and URLs stay.
    if (
        $oldImage &&
        $project->cover_image !== $oldImage &&
        str_starts_with(ltrim($oldImage, '/'), 'projects/')
    ) {
        Storage::disk('public')->delete($oldImage);
    }

    app(ActivityLogService::class)->updated(
        $project,
        'تعديل المشروع: ' . ($project->name ?? 'Project'),
        [
            'old' => $oldData,
            'new' => $project->fresh()->toArray(),
        ]
    );

    return new ProjectResource($project->fresh());
}
    
    
    public function destroy(Project $project)
    {
        $projectName = $project->name ?? 'Project';
        $projectId = $project->id;

        // Activity Log
        app(ActivityLogService::class)->deleted(
            $project,
            'حذف المشروع: ' . $projectName,
            [
                'deleted_project_id' => $projectId,
                'deleted_project_name' => $projectName,
            ]
        );

        $project->delete();

        return response()->json([
            'message'=>'Project deleted successfully'
        ]);
    }
}