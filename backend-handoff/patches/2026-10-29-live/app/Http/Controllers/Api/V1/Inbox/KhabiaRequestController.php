<?php

namespace App\Http\Controllers\Api\V1\Inbox;

use App\Http\Controllers\Controller;
use App\Models\KhabiaRequest;
use App\Notifications\NewKhabiaRequestNotification;
use App\Support\NotifyAdmins;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * "الخبيئة" box requests. Public submit; staff manage all; a delegate without
 * khabia_requests.manage only sees and updates the requests assigned to them.
 */
class KhabiaRequestController extends Controller
{
    private const DELEGATE_FIELDS = ['status', 'scheduled_at', 'delivered_at', 'collected_at', 'amount_collected', 'notes'];

    private function canManage(Request $request): bool
    {
        $user = $request->user();

        if ($user->roles()->where('slug', 'super-admin')->exists()) {
            return true;
        }

        return $user->roles()->whereHas('permissions', fn ($q) => $q->where('slug', 'khabia_requests.manage'))->exists();
    }

    private function authorizeRow(Request $request, KhabiaRequest $row): void
    {
        abort_if(!$this->canManage($request) && (int) $row->assigned_delegate_id !== (int) $request->user()->id, 403, 'Forbidden');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'full_name' => 'required|string|min:2|max:80',
            'phone' => ['required', 'regex:/^01\d{9}$/'],
            'city' => 'required|string|min:2|max:60',
            'address' => 'nullable|string|max:200',
            'notes' => 'nullable|string|max:1000',
            'source' => 'nullable|string|max:60',
            'user_agent' => 'nullable|string|max:255',
        ]);

        $recent = KhabiaRequest::where('phone', $data['phone'])
            ->where('created_at', '>=', now()->subMinutes(5))
            ->exists();

        if ($recent) {
            return response()->json([
                'message' => 'تم تسجيل طلب بنفس رقم الموبايل منذ قليل.',
            ], 429);
        }

        // Notes are internal: only staff (a signed-in admin creating a request) may set them.
        if (!$request->user('sanctum')) {
            unset($data['notes']);
        }

        $row = KhabiaRequest::create([
            ...$data,
            'ref_code' => $this->refCode(),
            'ip' => $request->ip(),
            'status' => 'pending',
        ]);

        NotifyAdmins::send(new NewKhabiaRequestNotification($row->id, $row->full_name, $row->city));

        return response()->json([
            'message' => 'تم تسجيل طلبك',
            'data' => $row->only(['id', 'ref_code', 'status']),
        ], 201);
    }

    public function index(Request $request)
    {
        $query = KhabiaRequest::query()->with('delegate:id,name,phone')->latest();

        if (!$this->canManage($request) || $request->query('assigned_delegate_id') === 'me') {
            $query->where('assigned_delegate_id', $request->user()->id);
        } elseif ($request->filled('assigned_delegate_id')) {
            $query->where('assigned_delegate_id', $request->integer('assigned_delegate_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn ($q) => $q->where('full_name', 'like', "%{$s}%")
                ->orWhere('phone', 'like', "%{$s}%")
                ->orWhere('city', 'like', "%{$s}%")
                ->orWhere('ref_code', 'like', "%{$s}%"));
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 500);

        return response()->json($query->paginate($perPage));
    }

    public function show(Request $request, KhabiaRequest $khabiaRequest)
    {
        $this->authorizeRow($request, $khabiaRequest);

        return response()->json(['data' => $khabiaRequest->load('delegate:id,name,phone')]);
    }

    public function update(Request $request, KhabiaRequest $khabiaRequest)
    {
        $this->authorizeRow($request, $khabiaRequest);

        $rules = [
            'status' => 'sometimes|in:pending,scheduled,delivered,collected,cancelled',
            'scheduled_at' => 'sometimes|nullable|date',
            'delivered_at' => 'sometimes|nullable|date',
            'collected_at' => 'sometimes|nullable|date',
            'amount_collected' => 'sometimes|nullable|numeric|min:0',
            'notes' => 'sometimes|nullable|string|max:2000',
        ];

        if ($this->canManage($request)) {
            $rules += [
                'full_name' => 'sometimes|string|min:2|max:80',
                'phone' => ['sometimes', 'regex:/^01\d{9}$/'],
                'city' => 'sometimes|string|min:2|max:60',
                'address' => 'sometimes|nullable|string|max:200',
                'assigned_delegate_id' => 'sometimes|nullable|integer|exists:users,id',
            ];
        }

        $data = $request->validate($rules);

        if (!$this->canManage($request)) {
            $data = array_intersect_key($data, array_flip(self::DELEGATE_FIELDS));
        }

        $khabiaRequest->update($data);

        return response()->json(['message' => 'Updated successfully', 'data' => $khabiaRequest->fresh()->load('delegate:id,name,phone')]);
    }

    public function proof(Request $request, KhabiaRequest $khabiaRequest)
    {
        $this->authorizeRow($request, $khabiaRequest);

        $data = $request->validate([
            'kind' => 'required|in:delivery,collection',
            'file' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $column = $data['kind'] . '_proof_path';

        if ($khabiaRequest->$column) {
            Storage::disk('public')->delete($khabiaRequest->$column);
        }

        // Random file names: proofs are not listed anywhere public.
        $update = [$column => $request->file('file')->store('khabia-proofs', 'public')];

        if ($data['kind'] === 'delivery') {
            $update['status'] = 'delivered';
            $update['delivered_at'] = $khabiaRequest->delivered_at ?? now();
        } else {
            $update['status'] = 'collected';
            $update['collected_at'] = $khabiaRequest->collected_at ?? now();
        }

        $khabiaRequest->update($update);

        return response()->json(['message' => 'Proof uploaded', 'data' => $khabiaRequest->fresh()]);
    }

    public function destroy(KhabiaRequest $khabiaRequest)
    {
        foreach (['delivery_proof_path', 'collection_proof_path'] as $col) {
            if ($khabiaRequest->$col) {
                Storage::disk('public')->delete($khabiaRequest->$col);
            }
        }

        $khabiaRequest->delete();

        return response()->json(['message' => 'Deleted Successfully']);
    }

    private function refCode(): string
    {
        do {
            $code = 'KHB-' . Str::upper(Str::random(6));
        } while (KhabiaRequest::where('ref_code', $code)->exists());

        return $code;
    }
}
