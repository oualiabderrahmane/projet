<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Poste;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserController extends Controller
{
    public function dashboard(Request $request)
    {
        $this->ensureAdmin($request);

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

    public function index(Request $request)
    {
        return Inertia::render('Admin/All', [
            'users' => User::with(['role:id,name', 'grade:id,nom', 'poste:id,nom'])
                ->orderBy('nom')
                ->orderBy('prenom')
                ->get([
                    'id',
                    'nom',
                    'prenom',
                    'email',
                    'profile_photo_path',
                    'role_id',
                    'grade_id',
                    'poste_id',
                    'created_at',
                    'updated_at',
                ])
                ->map(fn (User $user) => $this->userRow($user))
                ->values(),

            'roles' => Role::orderBy('name')->get(['id', 'name']),
            'grades' => Grade::orderBy('nom')->get(['id', 'nom']),
            'postes' => Poste::orderBy('nom')->get(['id', 'nom']),
            'canManageUsers' => true,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_nom' => 'required|string|max:100',
            'user_prenom' => 'nullable|string|max:100',
            'user_email' => 'required|string|email|max:150|unique:users,email',
            'user_password' => 'required|string|min:8|confirmed',
            'user_role_id' => 'required|integer|exists:roles,id',
            'user_grade_id' => 'nullable|integer|exists:grades,id',
            'user_poste_id' => 'nullable|integer|exists:postes,id',
            'user_photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $user = User::create([
            'nom' => $validated['user_nom'],
            'prenom' => $validated['user_prenom'] ?? null,
            'email' => $validated['user_email'],
            'role_id' => (int) $validated['user_role_id'],
            'grade_id' => self::nullableId($validated['user_grade_id'] ?? null),
            'poste_id' => self::nullableId($validated['user_poste_id'] ?? null),
            'password' => Hash::make($validated['user_password']),
        ]);

        $this->syncUserRole($user, (int) $validated['user_role_id']);

        if ($request->hasFile('user_photo')) {
            $this->storeProfilePhotoFor($user, $request->file('user_photo'));
        }

        return redirect()
            ->route('admin.users')
            ->with('success', "Utilisateur {$user->name} cree avec succes.");
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'user_nom' => 'required|string|max:100',
            'user_prenom' => 'nullable|string|max:100',
            'user_email' => [
                'required',
                'string',
                'email',
                'max:150',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'user_role_id' => 'required|integer|exists:roles,id',
            'user_grade_id' => 'nullable|integer|exists:grades,id',
            'user_poste_id' => 'nullable|integer|exists:postes,id',
        ]);

        $user->update([
            'nom' => $validated['user_nom'],
            'prenom' => $validated['user_prenom'] ?? null,
            'email' => $validated['user_email'],
            'role_id' => (int) $validated['user_role_id'],
            'grade_id' => self::nullableId($validated['user_grade_id'] ?? null),
            'poste_id' => self::nullableId($validated['user_poste_id'] ?? null),
        ]);
        $this->syncUserRole($user, (int) $validated['user_role_id']);

        return redirect()
            ->route('admin.users')
            ->with('success', "Utilisateur {$user->name} modifie avec succes.");
    }

    public function destroy(Request $request, User $user)
    {
        try {
            $name = $user->name;
            $photoPath = $user->profile_photo_path;
            $user->delete();

            if ($photoPath) {
                Storage::disk('public')->delete($photoPath);
            }
        } catch (\Throwable $exception) {
            return redirect()
                ->route('admin.users')
                ->with('error', 'Suppression impossible : cet utilisateur est utilise ailleurs.');
        }

        return redirect()
            ->route('admin.users')
            ->with('success', "Utilisateur {$name} supprime avec succes.");
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
            ->with('success', "Mot de passe de {$user->name} mis a jour avec succes.");
    }

    public function updatePhoto(Request $request, User $user)
    {
        $request->validate([
            'user_photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $this->storeProfilePhotoFor($user, $request->file('user_photo'));

        return redirect()
            ->route('admin.users')
            ->with('success', "Photo de profil de {$user->name} mise a jour avec succes.");
    }

    public function destroyPhoto(Request $request, User $user)
    {
        $this->deleteProfilePhotoFor($user);

        return redirect()
            ->route('admin.users')
            ->with('success', "Photo de profil de {$user->name} supprimee avec succes.");
    }

    public function updateOwnPhoto(Request $request)
    {
        $request->validate([
            'profile_photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $this->storeProfilePhotoFor($request->user(), $request->file('profile_photo'));

        return back()->with('success', 'Photo de profil mise a jour avec succes.');
    }

    public function destroyOwnPhoto(Request $request)
    {
        $this->deleteProfilePhotoFor($request->user());

        return back()->with('success', 'Photo de profil supprimee avec succes.');
    }

    public function updateOwnPassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Mot de passe actuel incorrect.',
            ]);
        }

        $request->user()->forceFill([
            'password' => Hash::make($validated['password']),
        ])->save();

        return back()->with('success', 'Mot de passe mis a jour avec succes.');
    }

    private static function nullableId(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    private function syncUserRole(User $user, int $roleId): void
    {
        $user->forceFill(['role_id' => $roleId])->save();
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->isAdmin(), 403);
    }

    private function userRow(User $user): array
    {
       $roles = collect($user->role ? [$user->role] : []);

        return [
            'id' => $user->id,
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'name' => $user->name,
            'email' => $user->email,
            'profile_photo_path' => $user->profile_photo_path,
            'profile_photo_url' => $user->profile_photo_url,
            'role_id' => $user->role_id,
            'grade_id' => $user->grade_id,
            'grade' => $user->grade?->nom,
            'poste_id' => $user->poste_id,
            'poste' => $user->poste?->nom,
            'roles' => $roles->values(),
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }

    private function storeProfilePhotoFor(User $user, UploadedFile $photo): void
    {
        $this->deleteProfilePhotoFor($user);

        $user->forceFill([
            'profile_photo_path' => $photo->store('profile-photos', 'public'),
        ])->save();
    }

    private function deleteProfilePhotoFor(User $user): void
    {
        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }

        $user->forceFill([
            'profile_photo_path' => null,
        ])->save();
    }
}
