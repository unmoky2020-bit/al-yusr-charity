<?php

namespace App\Http\Controllers\Api\V1\Extras;

use App\Http\Controllers\Controller;
use App\Support\StaffAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Extra fields of a record, kept in record_extras:
 *   GET /record-extras/{type}/{id}           public (only the allowed fields)
 *   PUT /admin/record-extras/{type}/{id}     {ai_summary_ar, ai_summary_en, ai_faq_ar, ai_faq_en}
 * type: project (table projects). Writes need projects.update; editors go through approval.
 */
class RecordExtrasController extends Controller
{
    private const TYPES = [
        'project' => ['table' => 'projects', 'permission' => 'projects.update', 'fields' => [
            'ai_summary_ar' => 2000, 'ai_summary_en' => 2000, 'ai_faq_ar' => 20000, 'ai_faq_en' => 20000,
        ]],
    ];

    public function show(string $type, int $id): JsonResponse
    {
        $cfg = $this->cfg($type);
        $row = DB::table('record_extras')->where('owner_type', $type)->where('owner_id', $id)->first();
        $data = $row ? (json_decode($row->data, true) ?: []) : [];

        return response()->json(['data' => (object) array_intersect_key($data, $cfg['fields'])]);
    }

    public function update(Request $request, string $type, int $id): JsonResponse
    {
        $cfg = $this->cfg($type);
        abort_unless(StaffAccess::has($request->user(), $cfg['permission']), 403, 'مش عندك صلاحية تعديل ده.');
        abort_unless(DB::table($cfg['table'])->where('id', $id)->exists(), 404, 'العنصر مش موجود.');

        $rules = [];
        foreach ($cfg['fields'] as $f => $max) {
            $rules[$f] = ['sometimes', 'nullable', 'string', "max:$max"];
        }
        $in = $request->validate($rules);

        $row = DB::table('record_extras')->where('owner_type', $type)->where('owner_id', $id)->first();
        $data = $row ? (json_decode($row->data, true) ?: []) : [];
        foreach ($in as $k => $v) {
            if ($v === null || trim((string) $v) === '') {
                unset($data[$k]);
            } else {
                $data[$k] = trim((string) $v);
            }
        }
        DB::table('record_extras')->updateOrInsert(
            ['owner_type' => $type, 'owner_id' => $id],
            ['data' => json_encode($data, JSON_UNESCAPED_UNICODE), 'updated_by' => optional($request->user())->id, 'updated_at' => now(), 'created_at' => $row->created_at ?? now()],
        );

        return response()->json(['data' => (object) $data]);
    }

    private function cfg(string $type): array
    {
        abort_unless(isset(self::TYPES[$type]), 404, 'النوع ده مش مدعوم.');

        return self::TYPES[$type];
    }
}
