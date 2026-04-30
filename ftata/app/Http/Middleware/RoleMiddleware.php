<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            if (!$request->expectsJson()) {
                return redirect()->route('login');
            }

            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // check if user has any of the required roles
        if (!$user->roles()->whereIn('name', $roles)->exists()) {
            if (!$request->expectsJson()) {
                abort(403);
            }

            return response()->json([
                'message' => 'Forbidden - insufficient role'
            ], 403);
        }

        return $next($request);
    }
}
