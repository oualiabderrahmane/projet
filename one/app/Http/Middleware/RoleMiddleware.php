<?php
namespace App\Http\Middleware;

use App\Models\User;
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

        $allowedRoles = collect($roles)
            ->map(fn (string $role) => User::normalizeRoleName($role))
            ->all();
        $userRole = User::normalizeRoleName($user->role?->name);

        if (!in_array($userRole, $allowedRoles, true)) {
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
