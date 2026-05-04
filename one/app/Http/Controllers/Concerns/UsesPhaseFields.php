<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Operateur;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

trait UsesPhaseFields
{
    private function operateurRows(string $type)
    {
        return Operateur::where('type', $type)
            ->orderBy('nom')
            ->get(['id', 'nom', 'grade', 'fonction', 'type']);
    }

    private function phaseFieldRules(string $operateurType): array
    {
        return [
            'operateur_id' => [
                'nullable',
                Rule::exists('operateurs', 'id')
                    ->where(fn ($query) => $query->where('type', $operateurType)),
            ],
        ];
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
            'operateur_nom' => $record->operateur?->nom,
            'operateur_grade' => $record->operateur?->grade,
            'operateur_fonction' => $record->operateur?->fonction,
            'date_debut' => $record->date_debut?->format('Y-m-d'),
            'date_fin' => $record->date_fin?->format('Y-m-d'),
        ];
    }
}
