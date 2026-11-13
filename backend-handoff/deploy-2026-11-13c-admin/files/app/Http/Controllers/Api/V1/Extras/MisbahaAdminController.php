<?php

namespace App\Http\Controllers\Api\V1\Extras;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Managing the shared misbahas from the dashboard (the public counter API stays the other developer's):
 *   PATCH  /admin/misbaha-rooms/{id}/details   name, created_by, target_total, kind, gender, is_hidden, reset_count
 *   DELETE /admin/misbaha-rooms/{id}           delete for good (not hide)
 *   POST   /admin/misbaha-rooms/bulk-delete    {ids: [...]}
 */
class MisbahaAdminController extends Controller
{
    public function update(Request $request, int $id): JsonResponse
    {
        abort_unless(DB::table('misbaha_rooms')->where('id', $id)->exists(), 404, 'السبحة مش موجودة.');
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:80'],
            'created_by' => ['sometimes', 'nullable', 'string', 'max:80'],
            'target_total' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100000000'],
            'kind' => ['sometimes', 'in:deceased,sick,group'],
            'gender' => ['sometimes', 'nullable', 'in:m,f'],
            'is_hidden' => ['sometimes', 'boolean'],
            'reset_count' => ['sometimes', 'boolean'],
        ], [
            'name.min' => 'الاسم قصير قوي.',
            'target_total.min' => 'الهدف لازم يكون 1 أو أكتر.',
        ]);
        $reset = (bool) ($data['reset_count'] ?? false);
        unset($data['reset_count']);
        if ($reset) {
            $data['total_count'] = 0;
        }
        if ($data) {
            $data['updated_at'] = now();
            DB::table('misbaha_rooms')->where('id', $id)->update($data);
        }
        Cache::forget('misbaha-rooms:stats');

        return response()->json(['data' => DB::table('misbaha_rooms')->where('id', $id)->first(['id', 'slug', 'kind', 'gender', 'name', 'created_by', 'total_count', 'target_total', 'is_hidden', 'last_activity_at', 'created_at', 'updated_at'])]);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = DB::table('misbaha_rooms')->where('id', $id)->delete();
        abort_unless($deleted, 404, 'السبحة مش موجودة.');
        Cache::forget('misbaha-rooms:stats');

        return response()->json(['data' => ['deleted' => 1]]);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $ids = $request->validate(['ids' => ['required', 'array', 'min:1', 'max:200'], 'ids.*' => ['integer']])['ids'];
        $n = DB::table('misbaha_rooms')->whereIn('id', $ids)->delete();
        Cache::forget('misbaha-rooms:stats');

        return response()->json(['data' => ['deleted' => $n]]);
    }
}
