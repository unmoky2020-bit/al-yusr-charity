<?php

namespace App\Http\Controllers\Api\V1\Inbox;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Notifications\NewContactMessageNotification;
use App\Support\NotifyAdmins;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * "تواصل معنا" messages: public submit, staff inbox.
 */
class ContactMessageController extends Controller
{
    public const SECTIONS = ['general', 'donation', 'qurbani', 'volunteer', 'partnership'];

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:100',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'section' => 'required|string|in:' . implode(',', self::SECTIONS),
            'message' => 'required|string|min:5|max:2000',
            'source' => 'nullable|string|max:60',
            'user_agent' => 'nullable|string|max:255',
        ]);

        // Same email twice within 5 minutes is a double submit or spam.
        $recent = ContactMessage::where('email', $data['email'])
            ->where('created_at', '>=', now()->subMinutes(5))
            ->exists();

        if ($recent) {
            return response()->json([
                'message' => 'تم استلام رسالة من نفس البريد منذ قليل، برجاء الانتظار بضع دقائق.',
            ], 429);
        }

        $message = ContactMessage::create([
            ...$data,
            'ref_code' => $this->refCode(),
            'ip' => $request->ip(),
            'status' => 'new',
        ]);

        NotifyAdmins::send(new NewContactMessageNotification($message->id, $message->name, $message->section));

        return response()->json([
            'message' => 'تم استلام رسالتك',
            'data' => $message->only(['id', 'ref_code', 'status', 'created_at']),
        ], 201);
    }

    public function index(Request $request)
    {
        $query = ContactMessage::query()->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('section')) {
            $query->where('section', $request->section);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn ($q) => $q->where('name', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%")
                ->orWhere('phone', 'like', "%{$s}%")
                ->orWhere('ref_code', 'like', "%{$s}%"));
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 200);

        return response()->json($query->paginate($perPage));
    }

    public function show(ContactMessage $contactMessage)
    {
        return response()->json(['data' => $contactMessage]);
    }

    public function update(Request $request, ContactMessage $contactMessage)
    {
        $data = $request->validate([
            'status' => 'required|in:new,read,replied,archived',
        ]);

        if ($data['status'] === 'replied' && !$contactMessage->replied_at) {
            $data['replied_at'] = now();
        }

        $data['handled_by'] = $request->user()->id;

        $contactMessage->update($data);

        return response()->json(['message' => 'Updated successfully', 'data' => $contactMessage->fresh()]);
    }

    public function destroy(ContactMessage $contactMessage)
    {
        $contactMessage->delete();

        return response()->json(['message' => 'Deleted Successfully']);
    }

    private function refCode(): string
    {
        do {
            $code = 'MSG-' . Str::upper(Str::random(6));
        } while (ContactMessage::where('ref_code', $code)->exists());

        return $code;
    }
}
