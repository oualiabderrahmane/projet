<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function redirectPathFor(User $user): string
    {
        $role = User::normalizeRoleName($user->role?->name);

        $routesByRole = [
            'admin' => 'admin.dashboard',
            'chef' => 'chef.home',
            'collect' => 'metadata.home',
            'extraction' => 'extraction.home',
            'digitalisation' => 'digitalisation.home',
            'completment_spatial' => 'completment-spatial.home',
            'traitment_vecteur' => 'traitement-vecteur.home',
            'redaction' => 'redaction.home',
        ];

        return isset($routesByRole[$role])
            ? route($routesByRole[$role])
            : route('login');
    }

    public function redirectAuthenticated()
    {
        if (!Auth::user()) {
            return redirect()->route('login');
        }

        return redirect($this->redirectPathFor(Auth::user()));
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => 'Email ou mot de passe incorrect.',
            ]);
        }

        $request->session()->regenerate();

        return redirect($this->redirectPathFor($request->user()));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
