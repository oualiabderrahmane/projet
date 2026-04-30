<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    private function redirectPathFor(User $user): string
    {
        $roles = $user->roles()->pluck('name')->all();

        $routesByRole = [
            'admin' => 'admin.dashboard',
            'collect' => 'collect.home',
            'extraction' => 'extraction.home',
            'digitalisation' => 'digitalisation.home',
            'completment_spatial' => 'completment-spatial.home',
            'traitment_vecteur' => 'traitement-vecteur.home',
            'redaction' => 'redaction.home',
        ];

        foreach ($routesByRole as $role => $routeName) {
            if (in_array($role, $roles, true)) {
                return route($routeName);
            }
        }

        return route('login');
    }

    public function redirectAuthenticated(Request $request)
    {
        if (!$request->user()) {
            return redirect()->route('login');
        }

        return redirect($this->redirectPathFor($request->user()));
    }

    // login par mail et mot de passe
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if ($request->expectsJson()) {
            $user = User::where('email', $credentials['email'])->first();

            if (!$user || !Hash::check($credentials['password'], $user->password)) {
                return response()->json([
                    'message' => 'Invalid credentials'
                ], 401);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user' => $user->load('roles:id,name'),
                'token' => $token,
                'redirect' => $this->redirectPathFor($user),
            ]);
        }

        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => 'Email ou mot de passe incorrect.',
            ]);
        }

        $request->session()->regenerate();

        return redirect()->intended($this->redirectPathFor($request->user()));
    }

    // LOGOUT
    public function logout(Request $request)
    {
        if ($request->expectsJson()) {
            $request->user()?->currentAccessToken()?->delete();

            return response()->json([
                'message' => 'Logged out successfully'
            ]);
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    // GET LOGGED USER
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
