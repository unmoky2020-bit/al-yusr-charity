<?php

namespace App\Http\Controllers\Api\V1\Program;

use App\Http\Controllers\Controller;
use App\Http\Requests\Program\StoreProgramRequest;
use App\Http\Requests\Program\UpdateProgramRequest;
use App\Http\Resources\ProgramResource;
use App\Models\Program;
use App\Models\CaseModel;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProgramController extends Controller
{

     //////////////////////////////////////////////
    //                   index
    ///////////////////////////////////////////////
    /** Delete a file only when this program uploaded it (programs/...); media-library files and URLs stay. */
    private function deleteOwnedFile(?string $path): void
    {
        if ($path && str_starts_with(ltrim($path, '/'), 'programs/')) {
            Storage::disk('public')->delete($path);
        }
    }

public function index(Request $request)
{
    $query = Program::with([
        'pageSections' => function ($query) {
            $query->where('is_enabled', true)
                  ->orderBy('sort_order');
        },
        'axis',
        'seasons',
        'donationPackages' => function ($query) {
            $query->orderBy('sort_order');
        },
        'cases',
    ])->latest();

    if ($request->filled('axis_id')) {
        $query->where('axis_id', $request->axis_id);
    }

    if ($request->filled('season_id')) {
        $query->whereHas('seasons', function ($q) use ($request) {
            $q->where('seasons.id', $request->season_id);
        });
    }

    if ($request->has('is_active')) {
        $query->where('is_active', (bool) $request->is_active);
    }

    if ($request->filled('status')) {
        $query->where('status', $request->status);
    }

    if ($request->filled('search')) {
        $search = $request->search;

        $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('name_ar', 'like', "%{$search}%")
              ->orWhere('name_en', 'like', "%{$search}%")
              ->orWhere('slug', 'like', "%{$search}%");
        });
    }

    return ProgramResource::collection($query->paginate(\App\Support\PerPage::from(request(), 10)));
}
     //////////////////////////////////////////////
    //                   Store 
    ///////////////////////////////////////////////
    public function store(
        StoreProgramRequest $request
    ) {
        $data = $request->validated();
        $data['top_section'] = $data['top_section'] ?? null;

        $seasonIds = $data['season_ids'] ?? [];

        unset($data['season_ids']);

        $data['status'] =
            $data['status'] ?? 'draft';

        $data['name'] =
            $data['title_ar']
            ?? $data['name_ar']
            ?? 'Program';

        $data['description'] =
            $data['description_ar']
            ?? $data['description_en']
            ?? null;

        $data['name_ar'] =
            $data['name_ar']
            ?? $data['title_ar']
            ?? null;

        $data['name_en'] =
            $data['name_en']
            ?? $data['title_en']
            ?? null;

        if ($request->hasFile('image')) {
            $data['image'] =
                $request->file('image')
                    ->store(
                        'programs',
                        'public'
                    );
        }
        
        if ($request->hasFile('hero_image')) {
    $data['hero_image'] = $request->file('hero_image')
        ->store('programs/hero', 'public');
}

        unset(
            $data['title_ar'],
            $data['title_en']
        );

   $caseIds = $data['case_ids'] ?? [];

        unset($data['case_ids']);

        $program = Program::create($data);

          if (!empty($caseIds)) {
             \App\Models\CaseModel::whereIn('id', $caseIds)
            ->whereNull('program_id')
            ->whereNull('project_id')
            ->whereNull('donation_campaign_id')
            ->update(['program_id' => $program->id]);
               }
               
        if (!empty($seasonIds)) {
            $program
                ->seasons()
                ->sync($seasonIds);
        }
    
        // Activity Log
        app(ActivityLogService::class)->created(
            $program,
            'إنشاء برنامج جديد: ' . $program->name,
            [
                'name' => $program->name,
                'name_ar' => $program->name_ar,
                'name_en' => $program->name_en,
                'status' => $program->status,
                'season_ids' => $seasonIds,
            ]
        );

        return response()->json([
            'success' => true,
            'message' =>
                'Program created successfully',
            'data' => new ProgramResource(
                $program->load([
                    'axis',
                    'seasons',
                    'donationPackages',
                    'cases',
                    'pageSections' => function ($query) {
    $query->where('is_enabled', true)
          ->orderBy('sort_order');
},
                ])
            ),
        ], 201);
    }


     //////////////////////////////////////////////
     //                 show
    ///////////////////////////////////////////////
public function show(Program $program)
{
    return new ProgramResource(
        $program->load([
            'pageSections' => function ($query) {
                $query->where('is_enabled', true)
                    ->orderBy('sort_order');
            },
            'axis',
            'seasons',
            'donationPackages' => function ($query) {
                $query->orderBy('sort_order');
            },
            'cases',
        ])
    );
}

     //////////////////////////////////////////////
    //                   update
    ///////////////////////////////////////////////
    
    public function update(
        UpdateProgramRequest $request,
        Program $program
    ) {
        $data = $request->validated();

        $seasonIds =
            $data['season_ids'] ?? null;

        unset($data['season_ids']);

        // $data['status'] =
        //     $data['status'] ?? 'draft';

        if (isset($data['title_ar'])) {
            $data['name_ar'] =
                $data['title_ar'];

            $data['name'] =
                $data['title_ar'];

            unset($data['title_ar']);
        }

        if (isset($data['title_en'])) {
            $data['name_en'] =
                $data['title_en'];

            unset($data['title_en']);
        }

        if (isset($data['description_ar'])) {
            $data['description'] =
                $data['description_ar'];
        }

        if ($request->hasFile('image')) {
            if ($program->image) {
                $this->deleteOwnedFile($program->image);
            }

            $data['image'] =
                $request->file('image')
                    ->store(
                        'programs',
                        'public'
                    );
        }
        if ($request->hasFile('hero_image')) {
    if ($program->hero_image) {
        $this->deleteOwnedFile($program->hero_image);
    }

    $data['hero_image'] = $request->file('hero_image')
        ->store('programs/hero', 'public');
}

        // Save old values before update
        $oldData = [
            'name' => $program->name,
            'name_ar' => $program->name_ar,
            'name_en' => $program->name_en,
            'status' => $program->status,
            'image' => $program->image,
            'season_ids' => $program->seasons()
                ->pluck('seasons.id')
                ->values()
                ->all(),
        ];

        $program->update($data);

        if ($seasonIds !== null) {
            $program
                ->seasons()
                ->sync($seasonIds);
        }

        // Activity Log
        app(ActivityLogService::class)->updated(
            $program,
            'تعديل البرنامج: ' . $program->name,
            [
                'old' => $oldData,
                'new' => [
                    'name' => $program->name,
                    'name_ar' => $program->name_ar,
                    'name_en' => $program->name_en,
                    'status' => $program->status,
                    'image' => $program->image,
                    'season_ids' => $seasonIds !== null
                        ? $seasonIds
                        : $oldData['season_ids'],
                ],
            ]
        );

        return response()->json([
            'success' => true,
            'message' =>
                'Program updated successfully',
            'data' => new ProgramResource(
                $program
                    ->fresh()
                    ->load([
                        'axis',
                        'seasons',
                        'pageSections' => function ($query) {
    $query->where('is_enabled', true)
          ->orderBy('sort_order');
},
                        'donationPackages' => function ($query) {
                            $query->orderBy(
                                'sort_order'
                            );
                        },
                        'cases',
                    ])
            ),
        ]);
    }


     //////////////////////////////////////////////
    //                   updateTopSection
    ///////////////////////////////////////////////
public function updateTopSection(Request $request, Program $program)
{
    $validated = $request->validate([
        'top_section' => ['sometimes', 'array'],
        'top_section.badge_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
        'top_section.title_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
        'top_section.title_en' => ['sometimes', 'nullable', 'string', 'max:255'],
        'top_section.subtitle_ar' => ['sometimes', 'nullable', 'string'],
        'top_section.subtitle_en' => ['sometimes', 'nullable', 'string'],
        'top_section.description_ar' => ['sometimes', 'nullable', 'string'],
        'top_section.description_en' => ['sometimes', 'nullable', 'string'],

        'top_section.primary_button_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
        'top_section.whatsapp_button_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
        'top_section.minimum_amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        'top_section.currency_ar' => ['sometimes', 'nullable', 'string', 'max:50'],
        'top_section.donation_available' => ['sometimes', 'boolean'],

        'top_section_image' => ['sometimes', 'nullable', 'image', 'max:5120'],
    ]);

    $topSection = $program->top_section ?? [];

    $newData = $validated['top_section'] ?? [];

    $topSection = array_replace_recursive($topSection, $newData);

    if ($request->hasFile('top_section_image')) {
        $oldImage = data_get($topSection, 'image');

        if ($oldImage && !str_starts_with($oldImage, 'http')) {
            Storage::disk('public')->delete($oldImage);
        }

        $topSection['image'] = $request->file('top_section_image')
            ->store('programs/top-sections', 'public');
    }

    $program->top_section = $topSection;
    $program->save();

    return response()->json([
        'success' => true,
        'message' => 'Top section updated successfully',
        'data' => new ProgramResource(
            $program->fresh()->load([
                'axis',
                'seasons',
                'pageSections' => function ($query) {
                    $query->where('is_enabled', true)
                        ->orderBy('sort_order');
                },
                'donationPackages' => function ($query) {
                    $query->orderBy('sort_order');
                },
                'cases',
            ])
        ),
    ]);
}


// destroy

    public function destroy(
        Program $program
    ) {
        // Save information before deletion
        $programName = $program->name;
        $programId = $program->id;

        if ($program->image) {
            $this->deleteOwnedFile($program->image);
        }
        if ($program->hero_image) {
    $this->deleteOwnedFile($program->hero_image);
}

        // Activity Log
        app(ActivityLogService::class)->deleted(
            $program,
            'حذف البرنامج: ' . $programName,
            [
                'deleted_program_id' => $programId,
                'deleted_program_name' => $programName,
                'status' => $program->status,
            ]
        );

        $program->delete();

        return response()->json([
            'success' => true,
            'message' =>
                'Program deleted successfully',
        ]);
    }
}