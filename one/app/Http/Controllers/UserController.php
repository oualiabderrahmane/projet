<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function dashboard()
    {
        $stats = [
            'users' => User::count(),
            'feuilles' => DB::table('feuilles')->count(),
            'coupures' => DB::table('coupures')->count(),
            'metadata' => DB::table('metadata')->count(),
            'fiches' => DB::table('coupure_fiche')->count(),
            'exports' => DB::table('validation_export')->count(),
        ];

        $feuilleStats = DB::table('feuilles as f')
            ->leftJoin('coupures as c', 'c.feuille_id', '=', 'f.id')
            ->selectRaw('f.id, f.nom, COUNT(c.id) as coupures_count')
            ->groupBy('f.id', 'f.nom')
            ->orderBy('f.nom')
            ->get();

        $roleStats = Role::query()
            ->withCount('users')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'users_count' => $role->users_count,
            ])
            ->values();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'feuilleStats' => $feuilleStats,
            'roleStats' => $roleStats,
        ]);
    }

    public function index()
    {
        return Inertia::render('Admin/All', [
            'users' => User::with('roles:id,name')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'phone', 'created_at', 'updated_at']),
            'roles' => Role::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function updatePassword(Request $request, User $user)
    {
        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->password = Hash::make($validated['password']);
        $user->save();

        return redirect()
            ->route('admin.users')
            ->with('success', "Mot de passe de {$user->name} mis à jour avec succès.");
    }
}
