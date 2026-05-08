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
            'label' => 'Métadonnée',
            'source' => 'metadata',
        ],
        [
            'key' => 'preparation',
            'label' => 'Préparation',
            'relation' => 'collecte_preparations',
            'uses_traite' => true,
        ],
        [
            'key' => 'extraction',
            'label' => 'Extraction altimétrique',
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
            'label' => 'Complètement spatial',
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
            'label' => 'Rédaction cartographique',
            'relation' => 'redaction_cartographiques',
            'uses_traite' => true,
        ],
        [
            'key' => 'controle',
            'label' => 'Contrôle cartographique',
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
                    'label' => 'Terminé',
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
                    'collecte_preparations.operateur:id,nom,prenom',
                    'collecte_preparations.types_osm:id,nom',
                    'extraction_altimetriques.operateur:id,nom,prenom',
                    'extraction_altimetriques.modes_extraction:id,nom',
                    'digitalisation2ds.operateur:id,nom,prenom',
                    'digitalisation2ds.modes_realisation:id,nom',
                    'digitalisation2ds.format:id,nom',
                    'completement_spatials.operateur:id,nom,prenom',
                    'completement_spatials.types_donnees_spatiales:id,nom',
                    'traitement_vecteurs.operateur:id,nom,prenom',
                    'traitement_vecteurs.mode_realisation:id,nom',
                    'traitement_vecteurs.format:id,nom',
                    'redaction_cartographiques.operateur:id,nom,prenom',
                    'redaction_cartographiques.format:id,nom',
                    'controle_cartographiques.operateur:id,nom,prenom',
                    'controle_cartographiques.types_controle:id,nom',
                    'controle_cartographiques.niveaux_controle:id,nom',
                    'validation_exports.operateur:id,nom,prenom',
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
            'current_stage_label' => $progress === 100 ? 'Terminé' : ($currentStage['label'] ?? 'Métadonnée'),
            'stages' => $stages,
        ];
    }

    private function formatStage(array $stage, ?Metadata $metadata): array
    {
        if (($stage['source'] ?? null) === 'metadata') {
            $date = $this->formatDate($metadata?->date_creation_metadata);

            return [
                'key' => $stage['key'],
                'label' => $stage['label'],
                'exists' => $metadata !== null,
                'traite' => $metadata !== null,
                'done' => $metadata !== null,
                'status' => $metadata ? 'done' : 'todo',
                'record_id' => $metadata?->id,
                'date_debut' => $date,
                'date_fin' => $date,
                'summary' => $metadata ? 'Métadonnée créée' : 'Métadonnée non créée',
                'details' => $this->detailRows([
                    'Métadonnée' => $metadata?->id ? "#{$metadata->id}" : null,
                    'Échelle' => $metadata?->echelle?->valeur,
                    'Date création' => $date,
                ]),
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
            'date_debut' => $this->formatDate($record?->date_debut),
            'date_fin' => $this->formatDate($record?->date_fin),
            'summary' => $this->stageSummary($stage['key'], $record, $exists, $traite),
            'details' => $this->stageDetails($stage['key'], $record),
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
        $byStage = collect(self::STAGES)
            ->map(fn (array $stage) => [
                'key' => $stage['key'],
                'label' => $stage['label'],
                'count' => $rows->where('current_stage_key', $stage['key'])->count(),
            ])
            ->push([
                'key' => 'termine',
                'label' => 'Terminé',
                'count' => $completed,
            ])
            ->values();

        return [
            'total' => $total,
            'completed' => $completed,
            'in_progress' => $inProgress,
            'not_started' => $notStarted,
            'average_progress' => $total > 0 ? (int) round($rows->avg('progress')) : 0,
            'by_stage' => $byStage,
        ];
    }

    private function stageSummary(string $key, ?Model $record, bool $exists, bool $traite): string
    {
        if (!$exists) {
            return 'Étape non démarrée';
        }

        if (!$traite) {
            return 'Étape démarrée, pas encore traitée';
        }

        return match ($key) {
            'controle' => 'Contrôle enregistré',
            'validation' => 'Validation export enregistrée',
            default => 'Étape traitée',
        };
    }

    private function stageDetails(string $key, ?Model $record): array
    {
        if (!$record) {
            return [];
        }

        return match ($key) {
            'preparation' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'Imagerie' => $record->imagerie ?? null,
                'Résolution' => $record->resolution ?? null,
                'Type OSM' => $record->types_osm?->nom,
                'Geonames MAJ' => $record->geonames_annee_mise_a_jour ?? null,
                'GADM' => $record->gadm_version ?? null,
            ]),
            'extraction' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'MNT' => $record->mnt ?? null,
                'Résolution' => $record->resolution ?? null,
                'Logiciel' => $record->logiciel_utilise ?? null,
                'Version' => $record->version_logiciel ?? null,
                'Mode extraction' => $record->modes_extraction?->nom,
            ]),
            'digitalisation' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'Logiciel' => $record->logiciel_utilise ?? null,
                'Version' => $record->version_logiciel ?? null,
                'Mode réalisation' => $record->modes_realisation?->nom,
                'Format' => $record->format?->nom,
            ]),
            'completement' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'Types de données' => $record->types_donnees_spatiales?->pluck('nom')->all(),
            ]),
            'traitement' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'Logiciel' => $record->logiciel_utilise ?? null,
                'Version' => $record->version_logiciel ?? null,
                'Mode réalisation' => $record->mode_realisation?->nom,
                'Tolérance' => $record->tolerance_topologique ?? null,
                'Format' => $record->format?->nom,
            ]),
            'redaction' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'Logiciel' => $record->logiciel_utilise ?? null,
                'Version' => $record->version_logiciel ?? null,
                'Format' => $record->format?->nom,
            ]),
            'controle' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'Type contrôle' => $record->types_controle?->nom,
                'Niveau contrôle' => $record->niveaux_controle?->nom,
                'Date contrôle' => $this->formatDate($record->date_controle ?? null),
                'Date édition' => $this->formatDate($record->date_edition ?? null),
            ]),
            'validation' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'Emplacement' => $record->emplacement ?? null,
                'Format export' => $record->format ?? null,
            ]),
            default => [],
        };
    }

    private function detailRows(array $items): array
    {
        return collect($items)
            ->map(function (mixed $value, string $label) {
                $displayValue = $this->displayValue($value);

                if ($displayValue === null) {
                    return null;
                }

                return [
                    'label' => $label,
                    'value' => $displayValue,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function displayValue(mixed $value): ?string
    {
        if ($value instanceof Collection) {
            $value = $value->all();
        }

        if (is_array($value)) {
            $value = collect($value)
                ->map(fn (mixed $item) => $this->displayValue($item))
                ->filter()
                ->join(', ');
        }

        if ($value instanceof \DateTimeInterface) {
            $value = $value->format('Y-m-d');
        }

        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function formatDate(mixed $date): ?string
    {
        if ($date instanceof \DateTimeInterface) {
            return $date->format('Y-m-d');
        }

        $date = trim((string) ($date ?? ''));

        return $date === '' ? null : $date;
    }
}
