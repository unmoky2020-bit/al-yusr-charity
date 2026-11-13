<?php

namespace App\Http\Controllers\Api\V1\Extras;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\StaffAccess;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * What an editor's pending change actually does, for «مراجعة المحتوى»:
 *   GET /admin/change-requests/details?ids=12,13,14
 * For each request: who sent it, what it targets (table, id, current title) and the field list
 * (field, value now, value after approval). Read-only: nothing is written here.
 * The content_change_requests table and its controller are the other developer's; this only reads them.
 */
class ChangeRequestDetailsController extends Controller
{
    private const HIDDEN = ['password', 'password_confirmation', 'token', 'remember_token', 'api_key', 'secret'];

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isReviewer = StaffAccess::isSuperAdmin($user)
            || ($user && $user->roles()->whereIn('slug', ['admin', 'super-admin'])->exists());
        abort_unless($isReviewer, 403, 'المراجعة للإدارة بس.');

        $ids = collect(explode(',', (string) $request->query('ids', '')))
            ->map(fn ($v) => (int) trim($v))->filter(fn ($v) => $v > 0)->unique()->take(100)->values();
        if ($ids->isEmpty()) {
            return response()->json(['data' => (object) []]);
        }

        $rows = DB::table('content_change_requests')->whereIn('id', $ids)->get();
        $authors = User::with('roles')->whereIn('id', $rows->pluck('user_id')->filter()->unique())->get()->keyBy('id');

        $out = [];
        foreach ($rows as $r) {
            $payload = is_string($r->payload) ? json_decode($r->payload, true) : (array) $r->payload;
            $params = is_string($r->route_parameters) ? json_decode($r->route_parameters, true) : (array) $r->route_parameters;
            $payload = is_array($payload) ? $payload : [];
            $model = $this->target($params);
            $a = $authors->get($r->user_id);

            $out[(string) $r->id] = [
                'author' => $a ? [
                    'id' => $a->id,
                    'name' => $a->name,
                    'email' => $a->email,
                    'roles' => $a->roles->pluck('slug')->values(),
                ] : null,
                'target' => [
                    'table' => $model?->getTable() ?? $this->tableFromUri((string) $r->route_uri),
                    'id' => $model?->getKey() ?? $r->record_id,
                    'title' => $model ? $this->title($model) : ($payload['name_ar'] ?? $payload['title_ar'] ?? $payload['name'] ?? $payload['title'] ?? null),
                    'exists' => (bool) $model,
                ],
                'changes' => $this->changes(strtoupper((string) $r->method), $payload, $model),
                'files' => $payload['_files'] ?? [],
            ];
        }

        return response()->json(['data' => $out]);
    }

    /** The record the request edits or deletes, from its saved route parameters. */
    private function target(mixed $params): ?Model
    {
        if (! is_array($params)) {
            return null;
        }
        foreach ($params as $p) {
            if (is_array($p) && ! empty($p['class']) && isset($p['id'])
                && class_exists($p['class']) && is_subclass_of($p['class'], Model::class)) {
                try {
                    return $p['class']::query()->find($p['id']);
                } catch (\Throwable) {
                    return null;
                }
            }
        }

        return null;
    }

    private function changes(string $method, array $payload, ?Model $model): array
    {
        $list = [];
        if ($method === 'DELETE') {
            if ($model) {
                foreach (['name_ar', 'title_ar', 'name', 'title', 'slug', 'status'] as $k) {
                    $v = $model->getAttribute($k);
                    if ($v !== null && $v !== '') {
                        $list[] = ['field' => $k, 'before' => $this->show($v), 'after' => null, 'changed' => true];
                    }
                }
            }

            return $list;
        }

        foreach ($payload as $k => $after) {
            if ($k === '_files' || in_array(strtolower((string) $k), self::HIDDEN, true) || str_starts_with((string) $k, '_')) {
                continue;
            }
            $before = $model && array_key_exists($k, $model->getAttributes()) ? $model->getAttribute($k) : null;
            $b = $this->show($before);
            $a = $this->show($after);
            $list[] = ['field' => (string) $k, 'before' => $model ? $b : null, 'after' => $a, 'changed' => ! $model || $b !== $a];
        }

        // Changed fields first, then the rest (still useful to see what the editor kept).
        usort($list, fn ($x, $y) => ($y['changed'] <=> $x['changed']));

        return $list;
    }

    private function show(mixed $v): ?string
    {
        if ($v === null) {
            return null;
        }
        if (is_bool($v)) {
            return $v ? 'true' : 'false';
        }
        if ($v instanceof \DateTimeInterface) {
            return $v->format('Y-m-d H:i');
        }
        if (is_array($v) || is_object($v)) {
            $v = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        $s = trim((string) $v);

        return mb_strlen($s) > 4000 ? mb_substr($s, 0, 4000) . '…' : $s;
    }

    private function title(Model $m): ?string
    {
        foreach (['name_ar', 'title_ar', 'name', 'title', 'slug', 'email'] as $k) {
            $v = $m->getAttribute($k);
            if (is_string($v) && trim($v) !== '') {
                return $v;
            }
        }

        return null;
    }

    private function tableFromUri(string $uri): ?string
    {
        $seg = explode('/', trim($uri, '/'));

        return $seg[2] ?? $seg[0] ?? null;
    }
}
