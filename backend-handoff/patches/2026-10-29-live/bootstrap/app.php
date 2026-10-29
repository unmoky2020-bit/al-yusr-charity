<?php

use Illuminate\Foundation\Application;
use App\Http\Middleware\EditorApprovalMiddleware;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\LocalizationMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {

          $middleware->api(prepend: [
             LocalizationMiddleware::class,
           ]);



    // There is no web "login" route: API guests must not be redirected anywhere.
    $middleware->redirectGuestsTo(fn ($request) => $request->is('api/*') ? null : '/');

    $middleware->alias([
    'permission' => \App\Http\Middleware\CheckPermission::class,
    'editor.approval' => \App\Http\Middleware\EditorApprovalMiddleware::class,
]);
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API clients always get JSON errors (no redirect to a "login" web route).
        $exceptions->shouldRenderJsonWhen(
            fn ($request) => $request->is('api/*') || $request->expectsJson()
        );

        // "No query results for model [App\Models\X]" leaks class names: answer a plain 404.
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->is('api/*') && $e->getPrevious() instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return response()->json(['message' => 'Not found.'], 404);
            }
        });
    })->create();
