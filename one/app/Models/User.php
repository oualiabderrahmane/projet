<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property string $nom
 * @property string|null $prenom
 * @property string $email
 * @property string $password
 * @property int|null $role_id
 * @property int|null $grade_id
 * @property int|null $poste_id
 * @property string|null $profile_photo_path
 * @property Collection|Role[] $roles
 */
class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'nom',
        'prenom',
        'email',
        'password',
        'profile_photo_path',
        'role_id',
        'grade_id',
        'poste_id',
    ];

    protected $casts = [
        'role_id' => 'int',
        'grade_id' => 'int',
        'poste_id' => 'int',
    ];

    protected $appends = [
        'name',
        'profile_photo_url',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function getNameAttribute(): string
    {
        return trim($this->nom . ' ' . ($this->prenom ?? ''));
    }

    public function setNameAttribute(?string $value): void
    {
        $parts = preg_split('/\s+/', trim((string) $value), 2);

        $this->attributes['nom'] = $parts[0] ?? '';
        $this->attributes['prenom'] = $parts[1] ?? null;
    }

    public function getProfilePhotoUrlAttribute(): ?string
    {
        if (!$this->profile_photo_path) {
            return null;
        }

        return '/storage/' . ltrim($this->profile_photo_path, '/');
    }



    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    public function poste()
    {
        return $this->belongsTo(Poste::class);
    }

    public function hasRole(string $roleName): bool
    {
        $roleName = self::normalizeRoleName($roleName);

        $roles = $this->role()
            ->pluck('name')
            ->map(fn (string $role) => self::normalizeRoleName($role))
            ->all();

        if ($this->role?->name) {
            $roles[] = self::normalizeRoleName($this->role->name);
        }

        return in_array($roleName, $roles, true);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public static function normalizeRoleName(?string $roleName): string
    {
        $roleName = Str::of((string) $roleName)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->toString();

        return match ($roleName) {
            'complement_spatial', 'completment_spatial' => 'completment_spatial',
            'traitement_vecteur', 'traitment_vecteur' => 'traitment_vecteur',
            default => $roleName,
        };
    }
}
