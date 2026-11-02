<?php

namespace App\Http\Controllers\Api\V1\Misbaha;

use App\Http\Controllers\Controller;
use App\Models\MisbahaRoom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Shared misbaha rooms: «سبحة لمتوفّى» / «سبحة لمريض» / «ذكر جماعي».
 *   POST /misbaha-rooms                 public, throttled: create
 *   GET  /misbaha-rooms                 public: latest visible rooms (the list on /misbaha)
 *   GET  /misbaha-rooms/stats           public: { rooms, total } across the site
 *   GET  /misbaha-rooms/{slug}          public: one room
 *   POST /misbaha-rooms/{slug}/count    public, throttled: add 1..500 to the shared total
 *   GET  /admin/misbaha-rooms           team: every room
 *   PATCH /admin/misbaha-rooms/{id}     team: hide / rename
 */
class MisbahaRoomController extends Controller
{
    private function present(MisbahaRoom $r): array
    {
        return [
            'slug' => $r->slug,
            'kind' => $r->kind ?: 'deceased',
            'gender' => $r->gender,
            'name' => $r->name,
            'created_by' => $r->created_by,
            'total_count' => (int) $r->total_count,
            'target_total' => $r->target_total ? (int) $r->target_total : null,
            'dhikr_id' => $r->dhikr_id,
            'created_at' => $r->created_at,
        ];
    }

    public function index(Request $request)
    {
        $perPage = min(30, max(1, (int) $request->input('per_page', 12)));
        $rooms = MisbahaRoom::where('is_hidden', false)
            ->when(in_array($request->input('kind'), ['deceased', 'sick', 'group'], true), fn ($q) => $q->where('kind', $request->input('kind')))
            ->orderByDesc('last_activity_at')
            ->orderByDesc('id')
            ->limit($perPage)
            ->get();

        return response()->json(['data' => $rooms->map(fn ($r) => $this->present($r))->values()]);
    }

    /** Site-wide numbers for the /misbaha page («سبحة اتعملت» / «ذكر اتقال»), cached for a minute. */
    public function stats()
    {
        $data = Cache::remember('misbaha-rooms:stats', 60, fn () => [
            'rooms' => MisbahaRoom::where('is_hidden', false)->count(),
            'total' => (int) MisbahaRoom::where('is_hidden', false)->sum('total_count'),
        ]);

        return response()->json(['data' => $data]);
    }

    public function show(string $slug)
    {
        $room = MisbahaRoom::where('slug', $slug)->where('is_hidden', false)->firstOrFail();

        return response()->json(['data' => $this->present($room)]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'kind' => ['nullable', 'string', 'in:deceased,sick,group'],
            'gender' => ['nullable', 'string', 'in:m,f'],
            'name' => ['required', 'string', 'min:2', 'max:80'],
            'created_by' => ['nullable', 'string', 'max:60'],
            'target_total' => ['nullable', 'integer', 'in:1000,10000,100000,1000000'],
            'dhikr_id' => ['nullable', 'string', 'max:40', 'regex:/^[a-z_]+$/'],
        ]);
        $clean = fn (?string $v) => $v === null ? null : trim(strip_tags($v));
        $ipHash = hash('sha256', (string) $request->ip() . config('app.key'));

        // At most 10 rooms per visitor per day (on top of the route throttle).
        $today = MisbahaRoom::where('creator_ip_hash', $ipHash)->where('created_at', '>=', now()->startOfDay())->count();
        if ($today >= 10) {
            return response()->json(['message' => 'وصلت للحد اليومي لإنشاء السبح. جرّب بكرة.'], 429);
        }

        do {
            $slug = Str::lower(Str::random(8));
        } while (MisbahaRoom::where('slug', $slug)->exists());

        $room = MisbahaRoom::create([
            'slug' => $slug,
            'kind' => $data['kind'] ?? 'deceased',
            'gender' => ($data['kind'] ?? 'deceased') === 'group' ? null : ($data['gender'] ?? null),
            'name' => $clean($data['name']),
            'created_by' => $clean($data['created_by'] ?? null) ?: null,
            'target_total' => $data['target_total'] ?? null,
            'dhikr_id' => $data['dhikr_id'] ?? null,
            'creator_ip_hash' => $ipHash,
            'last_activity_at' => now(),
        ]);

        return response()->json(['data' => $this->present($room)], 201);
    }

    public function count(Request $request, string $slug)
    {
        $n = (int) $request->validate(['count' => ['required', 'integer', 'min:1', 'max:500']])['count'];
        $room = MisbahaRoom::where('slug', $slug)->where('is_hidden', false)->firstOrFail();

        // Atomic increment: many people tapping at once never overwrite each other.
        DB::table('misbaha_rooms')->where('id', $room->id)->update([
            'total_count' => DB::raw('total_count + ' . $n),
            'last_activity_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['total' => (int) MisbahaRoom::whereKey($room->id)->value('total_count')]);
    }

    public function adminIndex(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->input('per_page', 50)));

        return response()->json(MisbahaRoom::orderByDesc('id')->paginate($perPage));
    }

    public function adminUpdate(Request $request, MisbahaRoom $misbahaRoom)
    {
        $data = $request->validate([
            'is_hidden' => ['sometimes', 'boolean'],
            'name' => ['sometimes', 'string', 'min:2', 'max:80'],
        ]);
        $misbahaRoom->update($data);

        return response()->json(['data' => $misbahaRoom->fresh()]);
    }
}
