<?php

namespace App\Http\Controllers;

use App\Models\Coupure;
use App\Models\Metadata;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class ChefController extends Controller
{
    private const STAGES = [
        [
            'key' => 'metadata',
            'label' => 'Metadata',
            'source' => 'metadata',
        ],
        [
            'key' => 'preparation',
            'label' => 'Preparation',
            'relation' => 'collecte_preparations',
            'uses_traite' => true,
        ],
        [
            'key' => 'extraction',
            'label' => 'Extraction altimetrique',
            'relation' => 'extraction_altimetriques',
            'uses_traite' => true,
        ],
        [
            'key' => 'digitalisation',
            'label' => 'Digitalisation 2D',
            'relation' => 'digitalisation2ds',
            'uses_traite' => true,
        ],
        [
            'key' => 'completement',
            'label' => 'Completement spatial',
            'relation' => 'completement_spatials',
            'uses_traite' => true,
        ],
        [
            'key' => 'traitement',
            'label' => 'Traitement vecteur',
            'relation' => 'traitement_vecteurs',
            'uses_traite' => true,
        ],
        [
            'key' => 'redaction',
            'label' => 'Redaction cartographique',
            'relation' => 'redaction_cartographiques',
            'uses_traite' => true,
        ],
        [
            'key' => 'controle',
            'label' => 'Controle cartographique',
            'relation' => 'controle_cartographiques',
            'uses_traite' => false,
        ],
        [
            'key' => 'validation',
            'label' => 'Validation export',
            'relation' => 'validation_exports',
            'uses_traite' => false,
        ],
    ];

    public function home()
    {
        $rows = $this->trackingRows();

        return Inertia::render('Chef/ChefHome', [
            'rows' => $rows,
            'stats' => $this->stats($rows),
            'stageOptions' => collect(self::STAGES)
                ->map(fn (array $stage) => [
                    'key' => $stage['key'],
                    'label' => $stage['label'],
                ])
                ->push([
                    'key' => 'termine',
                    'label' => 'Termine',
                ])
                ->values(),
        ]);
    }

    private function trackingRows(): Collection
    {
        return Coupure::with([
            'feuille:id,nom',
            'metadata' => fn ($query) => $query
                ->with([
                    'echelle:id,valeur',
                    'collecte_preparations:id,metadata_id,traite',
                    'extraction_altimetriques:id,metadata_id,traite',
                    'digitalisation2ds:id,metadata_id,traite',
                    'completement_spatials:id,metadata_id,traite',
                    'traitement_vecteurs:id,metadata_id,traite',
                    'redaction_cartographiques:id,metadata_id,traite',
                    'controle_cartographiques:id,metadata_id',
                    'validation_exports:id,metadata_id,emplacement,format',
                ])
                ->orderBy('id'),
        ])
            ->orderBy('feuille_id')
            ->orderBy('nom')
            ->get()
            ->flatMap(function (Coupure $coupure) {
                if ($coupure->metadata->isEmpty()) {
                    return [$this->formatRow($coupure)];
                }

                return $coupure->metadata
                    ->map(fn (Metadata $metadata) => $this->formatRow($coupure, $metadata));
            })
            ->values();
    }

    private function formatRow(Coupure $coupure, ?Metadata $metadata = null): array
    {
        $stages = collect(self::STAGES)
            ->map(fn (array $stage) => $this->formatStage($stage, $metadata))
            ->values();

        $doneCount = $stages->where('done', true)->count();
        $totalCount = $stages->count();
        $currentStage = $stages->firstWhere('done', false) ?? $stages->last();
        $progress = $totalCount > 0 ? (int) round(($doneCount / $totalCount) * 100) : 0;

        return [
            'id' => $metadata ? "metadata-{$metadata->id}" : "coupure-{$coupure->id}",
            'feuille_id' => $coupure->feuille?->id,
            'feuille_nom' => $coupure->feuille?->nom ?? 'Feuille inconnue',
            'coupure_id' => $coupure->id,
            'coupure_nom' => $coupure->nom,
            'metadata_id' => $metadata?->id,
            'echelle_valeur' => $metadata?->echelle?->valeur,
            'date_creation_metadata' => $metadata?->date_creation_metadata?->format('Y-m-d'),
            'done_count' => $doneCount,
            'total_count' => $totalCount,
            'progress' => $progress,
            'status' => $progress === 100 ? 'termine' : ($doneCount === 0 ? 'a_demarrer' : 'en_cours'),
            'current_stage_key' => $progress === 100 ? 'termine' : ($currentStage['key'] ?? 'metadata'),
            'current_stage_label' => $progress === 100 ? 'Termine' : ($currentStage['label'] ?? 'Metadata'),
            'stages' => $stages,
        ];
    }

    private function formatStage(array $stage, ?Metadata $metadata): array
    {
        if (($stage['source'] ?? null) === 'metadata') {
            return [
                'key' => $stage['key'],
                'label' => $stage['label'],
                'exists' => $metadata !== null,
                'traite' => $metadata !== null,
                'done' => $metadata !== null,
                'status' => $metadata ? 'done' : 'todo',
            ];
        }

        $record = $this->firstRecord($metadata, $stage['relation']);
        $exists = $record !== null;
        $traite = $exists && (
            ($stage['uses_traite'] ?? true)
                ? (bool) ($record->traite ?? false)
                : true
        );

        return [
            'key' => $stage['key'],
            'label' => $stage['label'],
            'exists' => $exists,
            'traite' => $traite,
            'done' => $traite,
            'status' => $traite ? 'done' : ($exists ? 'started' : 'todo'),
            'record_id' => $record?->id,
        ];
    }

    private function firstRecord(?Metadata $metadata, string $relation): ?Model
    {
        if (!$metadata) {
            return null;
        }

        $records = $metadata->getRelation($relation);

        return $records instanceof Collection ? $records->first() : $records;
    }

    private function stats(Collection $rows): array
    {
        $total = $rows->count();
        $completed = $rows->where('status', 'termine')->count();
        $notStarted = $rows->where('status', 'a_demarrer')->count();
        $inProgress = $total - $completed - $notStarted;

        return [
            'total' => $total,
            'completed' => $completed,
            'in_progress' => $inProgress,
            'not_started' => $notStarted,
            'average_progress' => $total > 0 ? (int) round($rows->avg('progress')) : 0,
            'by_stage' => $rows
                ->groupBy('current_stage_key')
                ->map(fn (Collection $items, string $key) => [
                    'key' => $key,
                    'label' => $items->first()['current_stage_label'],
                    'count' => $items->count(),
                ])
                ->values(),
        ];
    }
}
