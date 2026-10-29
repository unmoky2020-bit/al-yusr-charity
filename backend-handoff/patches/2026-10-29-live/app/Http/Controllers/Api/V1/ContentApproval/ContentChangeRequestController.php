<?php

namespace App\Http\Controllers\Api\V1\ContentApproval;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContentApproval\ReviewContentChangeRequest;
use App\Http\Resources\ContentApproval\ContentChangeRequestResource;
use App\Models\ContentChangeRequest;
use Illuminate\Http\Request;

class ContentChangeRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = ContentChangeRequest::with(['user', 'reviewer'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        return ContentChangeRequestResource::collection(
            $query->paginate(\App\Support\PerPage::from(request(), 20))
        );
    }

    public function show(ContentChangeRequest $contentChangeRequest)
    {
        return new ContentChangeRequestResource(
            $contentChangeRequest->load(['user', 'reviewer'])
        );
    }

    public function approve(
        ReviewContentChangeRequest $request,
        ContentChangeRequest $contentChangeRequest
    ) {
        if ($contentChangeRequest->status !== 'pending') {
            return response()->json([
                'message' => 'This request has already been reviewed.',
            ], 422);
        }

        try {
            $originalUser = $request->user();

            $payload = $contentChangeRequest->payload ?? [];

            if (is_string($payload)) {
                $payload = json_decode($payload, true);
            }

            if (!is_array($payload)) {
                return response()->json([
                    'message' => 'Invalid approval payload.',
                ], 422);
            }

            $method = strtoupper($contentChangeRequest->method);

            $executionRequest = Request::create(
                '/' . ltrim($contentChangeRequest->route_uri, '/'),
                $method,
                [],
                [],
                [],
                [
                    'HTTP_ACCEPT' => 'application/json',
                    'CONTENT_TYPE' => 'application/json',
                ],
                json_encode($payload, JSON_UNESCAPED_UNICODE)
            );

            // Make the saved payload available to Laravel validation
            // and controllers, whether they read JSON or request parameters.
            $executionRequest->json()->replace($payload);
            $executionRequest->request->replace($payload);

            $executionRequest->headers->set(
                'Content-Type',
                'application/json'
            );

            $executionRequest->headers->set(
                'Accept',
                'application/json'
            );

            $executionRequest->attributes->set(
                '_approval_execution',
                true
            );

            $executionRequest->setUserResolver(
                fn () => $originalUser
            );

            $executionRequest->setRouteResolver(
                function () use ($executionRequest) {
                    return app('router')
                        ->getRoutes()
                        ->match($executionRequest);
                }
            );

$container = app();

$originalRequest = $container->make('request');

try {
    $container->instance('request', $executionRequest);

    $response = app('router')->dispatch($executionRequest);
} finally {
    $container->instance('request', $originalRequest);
}
            if ($response->getStatusCode() >= 400) {
                return response()->json([
                    'message' => 'The approved operation could not be executed.',
                    'execution_status' => $response->getStatusCode(),
                    'execution_response' => method_exists($response, 'getData')
                        ? $response->getData(true)
                        : null,
                ], 422);
            }

            $contentChangeRequest->update([
                'status' => 'approved',
                'reviewed_by' => $originalUser->id,
                'review_note' => $request->review_note,
                'reviewed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Change request approved and executed successfully.',
                'request' => new ContentChangeRequestResource(
                    $contentChangeRequest->fresh()->load([
                        'user',
                        'reviewer',
                    ])
                ),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to execute approved change request.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }

    public function reject(
        ReviewContentChangeRequest $request,
        ContentChangeRequest $contentChangeRequest
    ) {
        if ($contentChangeRequest->status !== 'pending') {
            return response()->json([
                'message' => 'This request has already been reviewed.',
            ], 422);
        }

        $contentChangeRequest->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'review_note' => $request->review_note,
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Change request rejected successfully.',
            'request' => new ContentChangeRequestResource(
                $contentChangeRequest->fresh()->load([
                    'user',
                    'reviewer',
                ])
            ),
        ]);
    }
}