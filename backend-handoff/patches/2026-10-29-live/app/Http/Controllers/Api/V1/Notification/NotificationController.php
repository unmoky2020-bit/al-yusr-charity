<?php

namespace App\Http\Controllers\Api\V1\Notification;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

/**
 * The signed-in user's in-app notifications.
 *   GET    /notifications?unread=1&type=&per_page=   list (newest first) + unread_count
 *   GET    /notifications/unread-count               { unread_count, latest: { id, created_at } } — cheap poll
 *   PATCH  /notifications/{id}/read                  mark one read
 *   PATCH  /notifications/read-all                   mark all read
 *   DELETE /notifications/{id}                       delete one
 *   DELETE /notifications/read                       delete every read notification
 */
class NotificationController extends Controller
{
    /** Flat shape: payload fields at the top level. */
    private function present(DatabaseNotification $n): array
    {
        $data = is_array($n->data) ? $n->data : [];

        return [
            'id' => $n->id,
            'type' => $data['type'] ?? 'info',
            'title' => $data['title'] ?? '',
            'message' => $data['message'] ?? '',
            'url' => $data['url'] ?? null,
            'severity' => $data['severity'] ?? 'info',
            'data' => $data,
            'read_at' => $n->read_at,
            'created_at' => $n->created_at,
        ];
    }

    public function index(Request $request)
    {
        $query = $request->user()->notifications()->latest();

        if ($request->boolean('unread')) {
            $query->whereNull('read_at');
        }

        if ($request->filled('type')) {
            $query->where('data->type', $request->type);
        }

        $page = $query->paginate(min(max($request->integer('per_page', 20), 1), 100));

        return response()->json([
            'success' => true,
            'data' => collect($page->items())->map(fn ($n) => $this->present($n))->values(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'total' => $page->total(),
            ],
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function unreadCount(Request $request)
    {
        $latest = $request->user()->notifications()->latest()->first(['id', 'created_at']);

        return response()->json([
            'success' => true,
            'unread_count' => $request->user()->unreadNotifications()->count(),
            'latest' => $latest ? ['id' => $latest->id, 'created_at' => $latest->created_at] : null,
        ]);
    }

    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();

        if (!$notification) {
            return response()->json(['success' => false, 'message' => 'Notification not found.'], 404);
        }

        $notification->markAsRead();

        return response()->json(['success' => true, 'message' => 'Notification marked as read.']);
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['success' => true, 'message' => 'All notifications marked as read.']);
    }

    public function destroy(Request $request, string $id)
    {
        $deleted = $request->user()->notifications()->where('id', $id)->delete();

        if (!$deleted) {
            return response()->json(['success' => false, 'message' => 'Notification not found.'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Notification deleted.']);
    }

    public function destroyRead(Request $request)
    {
        $count = $request->user()->notifications()->whereNotNull('read_at')->delete();

        return response()->json(['success' => true, 'deleted' => $count]);
    }
}
