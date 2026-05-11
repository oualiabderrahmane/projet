<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

trait UsesPhaseFields
{
    private const PHASE_ROLE_MAP = [
        'collect' => 'collect',
        'extraction' => 'extraction',
        'digitalisation' => 'digitalisation',
        'completment_spatial' => 'completment_spatial',
        'traitment_vecteur' => 'traitment_vecteur',
        'redaction' => 'redaction',
        'controle' => 'redaction',
        'validation' => 'redaction',
    ];

    private function operateurRows(string $type)
    {
        return $this->phaseUserQuery($type)
            ->with(['grade:id,nom', 'poste:id,nom', 'role:id,name'])
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get(['id', 'nom', 'prenom', 'grade_id', 'poste_id', 'role_id'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'grade' => $user->grade?->nom,
                'poste' => $user->poste?->nom,
                'role' => $user->role?->name,
            ])
            ->values();
    }

    private function phaseFieldRules(string $operateurType): array
    {
        $userIds = $this->phaseUserQuery($operateurType)->pluck('id')->all();

        return [
            'operateur_id' => [
                'nullable',
                Rule::exists('users', 'id')
                    ->where(fn ($query) => $query->whereIn('id', $userIds ?: [0])),
            ],
        ];
    }

    private function phaseUserQuery(string $type): Builder
    {
        $roleName = User::normalizeRoleName(self::PHASE_ROLE_MAP[$type] ?? $type);
        $roleIds = Role::query()
            ->get(['id', 'name'])
            ->filter(fn (Role $role) => User::normalizeRoleName($role->name) === $roleName)
            ->pluck('id')
            ->all();

        return User::query()
            ->whereIn('role_id', $roleIds ?: [0]);
    }

    private function dateString(mixed $date): ?string
    {
        if ($date instanceof \DateTimeInterface) {
            return $date->format('Y-m-d');
        }

        $date = trim((string) ($date ?? ''));

        return $date === '' ? null : $date;
    }

    private function automaticPhaseDates(?Model $previousRecord = null, mixed $fallbackStart = null, ?Model $currentRecord = null): array
    {
        $start = $currentRecord?->date_debut
            ?? $previousRecord?->date_fin
            ?? $fallbackStart
            ?? Carbon::now();

        return [
            'date_debut' => $this->dateString($start) ?? Carbon::now()->toDateString(),
            'date_fin' => Carbon::now()->toDateString(),
        ];
    }

    private function phaseRowFields(Model $record): array
    {
        return [
            'operateur_id' => $record->operateur_id,
            'operateur_nom' => $record->operateur?->name,
            'operateur_grade' => $record->operateur?->grade?->nom,
            'operateur_poste' => $record->operateur?->poste?->nom,
            'date_debut' => $record->date_debut?->format('Y-m-d'),
            'date_fin' => $record->date_fin?->format('Y-m-d'),
        ];
    }
}
