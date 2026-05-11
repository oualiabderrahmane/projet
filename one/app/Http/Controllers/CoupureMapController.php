<?php

namespace App\Http\Controllers;

use App\Models\Coupure;
use App\Models\Metadata;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class CoupureMapController extends Controller
{
    private const STAGES = [
        [
            'key' => 'metadata',
            'label' => 'Métadonnée',
            'source' => 'metadata',
            'role' => ['collect'],
        ],
        [
            'key' => 'preparation',
            'label' => 'Préparation',
            'relation' => 'collecte_preparations',
            'uses_traite' => true,
            'role' => ['collect'],
        ],
        [
            'key' => 'extraction',
            'label' => 'Extraction altimétrique',
            'relation' => 'extraction_altimetriques',
            'uses_traite' => true,
            'role' => ['extraction'],
        ],
        [
            'key' => 'digitalisation',
            'label' => 'Digitalisation 2D',
            'relation' => 'digitalisation2ds',
            'uses_traite' => true,
            'role' => ['digitalisation'],
        ],
        [
            'key' => 'completement',
            'label' => 'Complètement spatial',
            'relation' => 'completement_spatials',
            'uses_traite' => true,
            'role' => ['completment_spatial'],
        ],
        [
            'key' => 'traitement',
            'label' => 'Traitement vecteur',
            'relation' => 'traitement_vecteurs',
            'uses_traite' => true,
            'role' => ['traitment_vecteur'],
        ],
        [
            'key' => 'redaction',
            'label' => 'Rédaction cartographique',
            'relation' => 'redaction_cartographiques',
            'uses_traite' => true,
            'role' => ['redaction'],
        ],
        [
            'key' => 'controle',
            'label' => 'Contrôle cartographique',
            'relation' => 'controle_cartographiques',
            'uses_traite' => false,
            'role' => ['redaction'],
        ],
        [
            'key' => 'validation',
            'label' => 'Validation export',
            'relation' => 'validation_exports',
            'uses_traite' => false,
            'role' => ['redaction'],
        ],
    ];

    public function index(Request $request)
    {
        $role = $this->roleNames($request);
        $canViewAllPhases = $this->canViewAllPhases($role);
        $stages = $this->allowedStages($role, $canViewAllPhases);
        $phaseKeys = $stages->pluck('key')->all();
        $requestedPhase = (string) $request->query('phase', '');
        $selectedPhase = $this->selectedPhase($requestedPhase, $phaseKeys, $canViewAllPhases);
        $coupures = $this->mapRows($phaseKeys, $canViewAllPhases);

        return Inertia::render('Maps/CoupuresMap', [
            'coupures' => $coupures,
            'phaseOptions' => $stages
                ->map(fn (array $stage) => [
                    'key' => $stage['key'],
                    'label' => $stage['label'],
                ])
                ->values(),
            'selectedPhase' => $selectedPhase,
            'canViewAllPhases' => $canViewAllPhases,
        ]);
    }

    private function roleNames(Request $request): array
    {
        if (!$request->user()) {
            return [];
        }

        $role = $request->user()
            ->role()
            ->pluck('name')
            ->all();

        if ($request->user()->role?->name && !in_array($request->user()->role->name, $role, true)) {
            $role[] = $request->user()->role->name;
        }

        return collect($role)
            ->map(fn (string $role) => strtolower($role))
            ->all();
    }

    private function canViewAllPhases(array $role): bool
    {
        return in_array('admin', $role, true) || in_array('chef', $role, true);
    }

    private function allowedStages(array $role, bool $canViewAllPhases): Collection
    {
        return collect(self::STAGES)
            ->filter(fn (array $stage) => $canViewAllPhases || count(array_intersect($stage['role'], $role)) > 0)
            ->values();
    }

    private function selectedPhase(string $requestedPhase, array $phaseKeys, bool $canViewAllPhases): string
    {
        if ($canViewAllPhases && ($requestedPhase === '' || $requestedPhase === 'all')) {
            return 'all';
        }

        if (in_array($requestedPhase, $phaseKeys, true)) {
            return $requestedPhase;
        }

        return $phaseKeys[0] ?? 'all';
    }

    private function mapRows(array $phaseKeys, bool $canViewAllPhases): Collection
    {
        $stageKeys = $canViewAllPhases
            ? collect(self::STAGES)->pluck('key')->all()
            : $phaseKeys;

        return Coupure::with([
            'feuille:id,nom',
            'metadata' => fn ($query) => $query
                ->with([
                    'pay:id,nom',
                    'systemes_reference:id,nom,type,zone',
                    'types_releve:id,nom',
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
            ->flatMap(function (Coupure $coupure) use ($stageKeys) {
                if ($coupure->metadata->isEmpty()) {
                    return [$this->formatMapRow($coupure, null, $stageKeys)];
                }

                return $coupure->metadata
                    ->map(fn (Metadata $metadata) => $this->formatMapRow($coupure, $metadata, $stageKeys));
            })
            ->values();
    }

    private function formatMapRow(Coupure $coupure, ?Metadata $metadata, array $stageKeys): array
    {
        $phases = collect(self::STAGES)
            ->filter(fn (array $stage) => in_array($stage['key'], $stageKeys, true))
            ->map(fn (array $stage) => $this->formatStage($stage, $metadata))
            ->values();
        $doneCount = $phases->where('done', true)->count();
        $totalCount = max($phases->count(), 1);
        $overviewStatus = $doneCount === 0
            ? 'todo'
            : ($doneCount === $totalCount ? 'done' : 'started');

        return [
            'id' => $metadata ? "metadata-{$metadata->id}" : "coupure-{$coupure->id}",
            'feuille_id' => $coupure->feuille?->id,
            'feuille_nom' => $coupure->feuille?->nom ?? 'Feuille inconnue',
            'coupure_id' => $coupure->id,
            'coupure_nom' => $coupure->nom,
            'coupure_label' => $coupure->label,
            'metadata_id' => $metadata?->id,
            'pays_id' => $metadata?->pay?->id,
            'pays_nom' => $metadata?->pay?->nom,
            'echelle_id' => $metadata?->echelle?->id,
            'echelle_valeur' => $metadata?->echelle?->valeur,
            'date_creation_metadata' => $this->formatDate($metadata?->date_creation_metadata),
            'search_label' => collect([
                $coupure->feuille?->nom,
                $coupure->nom,
                $coupure->label,
                $metadata?->pay?->nom,
                $metadata?->echelle?->valeur,
            ])->filter()->join(' '),
            'geometry' => $this->geometry($coupure),
            'overview' => [
                'done_count' => $doneCount,
                'total_count' => $phases->count(),
                'progress' => (int) round(($doneCount / $totalCount) * 100),
                'status' => $overviewStatus,
                'status_label' => $this->statusLabel($overviewStatus),
            ],
            'phases' => $phases,
        ];
    }

    private function formatStage(array $stage, ?Metadata $metadata): array
    {
        if (($stage['source'] ?? null) === 'metadata') {
            $exists = $metadata !== null;

            return [
                'key' => $stage['key'],
                'label' => $stage['label'],
                'exists' => $exists,
                'traite' => $exists,
                'done' => $exists,
                'status' => $exists ? 'done' : 'todo',
                'status_label' => $this->statusLabel($exists ? 'done' : 'todo'),
                'record_id' => $metadata?->id,
                'date_debut' => $this->formatDate($metadata?->date_creation_metadata),
                'date_fin' => $this->formatDate($metadata?->date_creation_metadata),
                'details' => $this->detailRows([
                    'Métadonnée' => $metadata?->id ? "#{$metadata->id}" : null,
                    'Pays' => $metadata?->pay?->nom,
                    'Système' => $this->systemReferenceLabel($metadata),
                    'Type relevé' => $metadata?->types_releve?->nom,
                    'Échelle' => $metadata?->echelle?->valeur,
                    'Date création' => $this->formatDate($metadata?->date_creation_metadata),
                ]),
            ];
        }

        $record = $this->firstRecord($metadata, $stage['relation']);
        $exists = $record !== null;
        $done = $exists && (
            ($stage['uses_traite'] ?? true)
                ? (bool) ($record->traite ?? false)
                : true
        );
        $status = $done ? 'done' : ($exists ? 'started' : 'todo');

        return [
            'key' => $stage['key'],
            'label' => $stage['label'],
            'exists' => $exists,
            'traite' => $done,
            'done' => $done,
            'status' => $status,
            'status_label' => $this->statusLabel($status),
            'record_id' => $record?->id,
            'date_debut' => $this->formatDate($record?->date_debut ?? null),
            'date_fin' => $this->formatDate($record?->date_fin ?? null),
            'details' => $this->stageDetails($stage['key'], $record),
        ];
    }

    private function firstRecord(?Metadata $metadata, string $relation): ?Model
    {
        if (!$metadata || !$metadata->relationLoaded($relation)) {
            return null;
        }

        $records = $metadata->getRelation($relation);

        return $records instanceof Collection ? $records->first() : $records;
    }

    private function stageDetails(string $key, ?Model $record): array
    {
        if (!$record) {
            return [];
        }

        return match ($key) {
            'preparation' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'Date début' => $this->formatDate($record->date_debut ?? null),
                'Date fin' => $this->formatDate($record->date_fin ?? null),
                'Imagerie' => $record->imagerie ?? null,
                'Résolution' => $record->resolution ?? null,
                'Type OSM' => $record->types_osm?->nom,
                'Geonames MAJ' => $record->geonames_annee_mise_a_jour ?? null,
                'GADM' => $record->gadm_version ?? null,
            ]),
            'extraction' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'Date début' => $this->formatDate($record->date_debut ?? null),
                'Date fin' => $this->formatDate($record->date_fin ?? null),
                'MNT' => $record->mnt ?? null,
                'Résolution' => $record->resolution ?? null,
                'Logiciel' => $record->logiciel_utilise ?? null,
                'Version' => $record->version_logiciel ?? null,
                'Mode extraction' => $record->modes_extraction?->nom,
            ]),
            'digitalisation' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'Date début' => $this->formatDate($record->date_debut ?? null),
                'Date fin' => $this->formatDate($record->date_fin ?? null),
                'Logiciel' => $record->logiciel_utilise ?? null,
                'Version' => $record->version_logiciel ?? null,
                'Mode réalisation' => $record->modes_realisation?->nom,
                'Format' => $record->format?->nom,
            ]),
            'completement' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'Date début' => $this->formatDate($record->date_debut ?? null),
                'Date fin' => $this->formatDate($record->date_fin ?? null),
                'Types de données' => $record->types_donnees_spatiales?->pluck('nom')->all(),
            ]),
            'traitement' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'Date début' => $this->formatDate($record->date_debut ?? null),
                'Date fin' => $this->formatDate($record->date_fin ?? null),
                'Logiciel' => $record->logiciel_utilise ?? null,
                'Version' => $record->version_logiciel ?? null,
                'Mode réalisation' => $record->mode_realisation?->nom,
                'Tolérance' => $record->tolerance_topologique ?? null,
                'Format' => $record->format?->nom,
            ]),
            'redaction' => $this->detailRows([
                'Opérateur' => $record->operateur?->name,
                'Date début' => $this->formatDate($record->date_debut ?? null),
                'Date fin' => $this->formatDate($record->date_fin ?? null),
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

    private function geometry(Coupure $coupure): array
    {
        $raw = [
            'latitude_nord' => $coupure->latitude_nord,
            'latitude_sud' => $coupure->latitude_sud,
            'longitude_ouest' => $coupure->longitude_ouest,
            'longitude_est' => $coupure->longitude_est,
        ];
        $north = $this->parseCoordinate($coupure->latitude_nord, 'lat');
        $south = $this->parseCoordinate($coupure->latitude_sud, 'lat');
        $west = $this->parseCoordinate($coupure->longitude_ouest, 'lon');
        $east = $this->parseCoordinate($coupure->longitude_est, 'lon');

        if ($north === null || $south === null || $west === null || $east === null) {
            return [
                'has_geometry' => false,
                'raw' => $raw,
                'bounds' => null,
                'center' => null,
            ];
        }

        $latMin = min($north, $south);
        $latMax = max($north, $south);
        $lonMin = min($west, $east);
        $lonMax = max($west, $east);

        if ($latMin === $latMax || $lonMin === $lonMax) {
            return [
                'has_geometry' => false,
                'raw' => $raw,
                'bounds' => null,
                'center' => null,
            ];
        }

        return [
            'has_geometry' => true,
            'raw' => $raw,
            'bounds' => [
                [round($latMin, 6), round($lonMin, 6)],
                [round($latMax, 6), round($lonMax, 6)],
            ],
            'center' => [
                round(($latMin + $latMax) / 2, 6),
                round(($lonMin + $lonMax) / 2, 6),
            ],
        ];
    }

    private function parseCoordinate(?string $value, string $axis): ?float
    {
        $value = trim((string) ($value ?? ''));

        if ($value === '') {
            return null;
        }

        $normalized = str_replace(',', '.', $value);
        $upper = strtoupper($normalized);
        preg_match_all('/-?\d+(?:\.\d+)?/', $normalized, $matches);

        if (empty($matches[0])) {
            return null;
        }

        $first = (float) $matches[0][0];
        $coordinate = abs($first);

        if (isset($matches[0][1])) {
            $coordinate += ((float) $matches[0][1]) / 60;
        }

        if (isset($matches[0][2])) {
            $coordinate += ((float) $matches[0][2]) / 3600;
        }

        $sign = $first < 0 ? -1 : 1;
        $hasWest = str_contains($upper, 'OUEST')
            || str_contains($upper, 'WEST')
            || preg_match('/(^|[^A-Z])(W|O)([^A-Z]|$)/', $upper);
        $hasSouth = str_contains($upper, 'SUD')
            || str_contains($upper, 'SOUTH')
            || preg_match('/(^|[^A-Z])S([^A-Z]|$)/', $upper);
        $hasEast = str_contains($upper, 'EST')
            || str_contains($upper, 'EAST')
            || preg_match('/(^|[^A-Z])E([^A-Z]|$)/', $upper);
        $hasNorth = str_contains($upper, 'NORD')
            || str_contains($upper, 'NORTH')
            || preg_match('/(^|[^A-Z])N([^A-Z]|$)/', $upper);

        if ($hasWest || $hasSouth) {
            $sign = -1;
        } elseif ($hasNorth || $hasEast) {
            $sign = 1;
        }

        $coordinate *= $sign;

        if ($axis === 'lat' && abs($coordinate) > 90) {
            return null;
        }

        if ($axis === 'lon' && abs($coordinate) > 180) {
            return null;
        }

        return $coordinate;
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

    private function systemReferenceLabel(?Metadata $metadata): ?string
    {
        if (!$metadata?->systemes_reference) {
            return null;
        }

        return collect([
            $metadata->systemes_reference->nom,
            $metadata->systemes_reference->type,
            $metadata->systemes_reference->zone ? 'Zone ' . $metadata->systemes_reference->zone : null,
        ])->filter()->join(' - ');
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'done' => 'Traité',
            'started' => 'En cours',
            default => 'Non traité',
        };
    }
}
