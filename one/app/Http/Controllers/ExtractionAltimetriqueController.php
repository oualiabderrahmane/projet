<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesPhaseFields;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Models\CollectePreparation;
use App\Models\ExtractionAltimetrique;
use App\Models\LogicielUtilise;
use App\Models\Metadata;
use App\Models\ModesExtraction;
use App\Models\Echelle;

class ExtractionAltimetriqueController extends Controller
{
    use UsesPhaseFields;

    private function nextId(string $modelClass): int
    {
        $lastId = $modelClass::query()
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('id');

        return ((int) $lastId) + 1;
    }

    private function formatMetadataRows(Collection $metadataRows)
    {
        return $metadataRows
            ->map(fn (Metadata $metadata) => [
                'id' => $metadata->id,
                'feuille_id' => $metadata->coupure?->feuille?->id,
                'feuille_nom' => $metadata->coupure?->feuille?->nom,
                'coupure_id' => $metadata->coupure?->id,
                'coupure_nom' => $metadata->coupure?->nom,
                'coupure_label' => $metadata->coupure?->label,
                'echelle_id' => $metadata->echelle?->id,
                'echelle_valeur' => $metadata->echelle?->valeur,
            ])
            ->values();
    }

    private function metadataCollections(?int $includeMetadataId = null): array
    {
        $all = Metadata::with(['coupure.feuille', 'echelle'])
            ->whereHas('collecte_preparations', fn ($relation) => $relation->where('traite', true))
            ->orderBy('id')
            ->get();

        $usedMetadataIds = ExtractionAltimetrique::query()
            ->pluck('metadata_id')
            ->map(fn ($id) => (int) $id)
            ->all();
        $usedLookup = array_fill_keys($usedMetadataIds, true);

        $available = $all
            ->filter(function (Metadata $metadata) use ($includeMetadataId, $usedLookup) {
                if ($includeMetadataId && (int) $metadata->id === $includeMetadataId) {
                    return true;
                }

                return !isset($usedLookup[(int) $metadata->id]);
            })
            ->values();

        return [
            'all' => $this->formatMetadataRows($all),
            'available' => $this->formatMetadataRows($available),
        ];
    }

    private function extractionRows()
    {
        return ExtractionAltimetrique::with([
            'metadata.coupure.feuille',
            'metadata.echelle',
            'modes_extraction',
            'operateur',
        ])
            ->orderByDesc('id')
            ->get()
            ->map(fn (ExtractionAltimetrique $extraction) => [
                'id' => $extraction->id,
                'metadata_id' => $extraction->metadata_id,
                'feuille_id' => $extraction->metadata?->coupure?->feuille?->id,
                'feuille_nom' => $extraction->metadata?->coupure?->feuille?->nom,
                'coupure_id' => $extraction->metadata?->coupure?->id,
                'coupure_nom' => $extraction->metadata?->coupure?->nom,
                'coupure_label' => $extraction->metadata?->coupure?->label,
                'echelle_id' => $extraction->metadata?->echelle?->id,
                'echelle_valeur' => $extraction->metadata?->echelle?->valeur,
                ...$this->phaseRowFields($extraction),
                'mnt' => $extraction->mnt,
                'resolution' => $extraction->resolution,
                'logiciel_utilise' => $extraction->logiciel_utilise,
                'version_logiciel' => $extraction->version_logiciel,
                'mode_extraction_id' => $extraction->mode_extraction_id,
                'mode_extraction_nom' => $extraction->modes_extraction?->nom,
                'traite' => (bool) $extraction->traite,
            ])
            ->values();
    }

    public function home()
    {
        $metadata = $this->metadataCollections();

        return Inertia::render('Extraction/HomeExtraction', [
            'metadata' => $metadata['all'],
            'metadataForExtraction' => $metadata['available'],
            'modesExtraction' => ModesExtraction::orderBy('nom')->get(['id', 'nom']),
            'logicielsUtilises' => LogicielUtilise::orderBy('id')->get(['id', 'nom']),
            'operateurs' => $this->operateurRows('extraction'),
            'extractions' => $this->extractionRows(),
            'echelles'=>Echelle::all(['id', 'valeur']),
        ]);
    }

    public function index()
    {
        return ExtractionAltimetrique::with('metadata.coupure.feuille')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => [
                'required',
                'exists:metadata,id',
                'unique:extraction_altimetrique,metadata_id',
                Rule::exists('collecte_preparation', 'metadata_id')
                    ->where(fn ($query) => $query->where('traite', true)),
            ],
            ...$this->phaseFieldRules('extraction'),
            'mnt' => 'nullable|string|max:150',
            'resolution' => 'nullable|string|max:100',
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_extraction_id' => 'nullable|exists:modes_extraction,id',
        ]);

        $record = DB::transaction(function () use ($validated) {
            $previous = CollectePreparation::where('metadata_id', $validated['metadata_id'])->first();

            return ExtractionAltimetrique::create([
                'id' => $this->nextId(ExtractionAltimetrique::class),
                ...$validated,
                ...$this->automaticPhaseDates($previous),
                'traite' => true,
            ]);
        });

        if ($request->expectsJson()) {
            return response()->json($record, 201);
        }

        return redirect()
            ->route('extraction.home')
            ->with('success', 'Extraction altimetrique créée avec succès.');
    }

    public function show($id)
    {
        return ExtractionAltimetrique::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $record = ExtractionAltimetrique::findOrFail($id);

        $validated = $request->validate([
            'metadata_id' => 'required|exists:metadata,id|unique:extraction_altimetrique,metadata_id,' . $record->id,
            ...$this->phaseFieldRules('extraction'),
            'mnt' => 'nullable|string|max:150',
            'resolution' => 'nullable|string|max:100',
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_extraction_id' => 'nullable|exists:modes_extraction,id',
        ]);

        $previous = CollectePreparation::where('metadata_id', $validated['metadata_id'])->first();

        $record->update([
            ...$validated,
            ...$this->automaticPhaseDates($previous, currentRecord: $record),
        ]);

        if ($request->expectsJson()) {
            return response()->json($record);
        }

        return redirect()
            ->route('extraction.home')
            ->with('success', 'Extraction altimetrique modifiée avec succès.');
    }

    public function destroy(Request $request, $id)
    {
        try {
            $deleted = ExtractionAltimetrique::destroy($id);
        } catch (\Throwable $exception) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Suppression impossible'], 409);
            }

            return redirect()
                ->route('extraction.home')
                ->with('error', 'Suppression impossible : cette extraction est utilisee ailleurs.');
        }

        if ($request->expectsJson()) {
            return response()->json(['deleted' => $deleted]);
        }

        return redirect()
            ->route('extraction.home')
            ->with('success', 'Extraction supprimee avec succes.');
    }
}
