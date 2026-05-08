<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

trait UsesPhaseFields
{
    private const PHASE_ROLE_MAP = [
        'Collect',
        'Extraction',
        'Digitalisation',
        'Complément Spatial',
        'Traitement Vecteur',
        'Rédaction',
    ];

    private function operateurRows(string $type)
    {
        return $this->phaseUserQuery($type)
            ->with(['grade:id,nom', 'poste:id,nom'])
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get(['id', 'nom', 'prenom', 'grade_id', 'poste_id', 'role_id'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'nom' => $user->name,
                'prenom' => $user->prenom,
                'grade' => $user->grade?->nom,
                'poste' => $user->poste?->nom,
                'role' => $user->role?->nom,

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
        $roleName = strtolower(self::PHASE_ROLE_MAP[$type] ?? $type);

        return User::query()
            ->where(function (Builder $query) use ($roleName): void {
                $query
                    ->orWhereHas('role', fn (Builder $roleQuery) => $roleQuery->whereRaw('LOWER(name) = ?', [$roleName]));
            });
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
