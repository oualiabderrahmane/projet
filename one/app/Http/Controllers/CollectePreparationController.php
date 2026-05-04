<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use App\Models\CollectePreparation;
use App\Models\Metadata;
use App\Models\TypesOsm;

class CollectePreparationController extends Controller
{
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
                'echelle_id' => $metadata->echelle?->id,
                'echelle_valeur' => $metadata->echelle?->valeur,
            ])
            ->values();
    }

    private function metadataCollections(?int $includeMetadataId = null): array
    {
        $all = Metadata::with(['coupure.feuille', 'echelle'])
            ->orderBy('id')
            ->get();

        $usedMetadataIds = CollectePreparation::query()
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

    private function preparationRows()
    {
        return CollectePreparation::with([
            'metadata.coupure.feuille',
            'metadata.echelle',
            'types_osm',
        ])
            ->orderByDesc('id')
            ->get()
            ->map(fn (CollectePreparation $preparation) => [
                'id' => $preparation->id,
                'metadata_id' => $preparation->metadata_id,
                'feuille_id' => $preparation->metadata?->coupure?->feuille?->id,
                'feuille_nom' => $preparation->metadata?->coupure?->feuille?->nom,
                'coupure_id' => $preparation->metadata?->coupure?->id,
                'coupure_nom' => $preparation->metadata?->coupure?->nom,
                'echelle_id' => $preparation->metadata?->echelle?->id,
                'echelle_valeur' => $preparation->metadata?->echelle?->valeur,
                'date_creation_metadata' => $preparation->metadata?->date_creation_metadata?->format('Y-m-d'),
                'imagerie' => $preparation->imagerie,
                'resolution' => $preparation->resolution,
                'type_osm_id' => $preparation->type_osm_id,
                'type_osm_nom' => $preparation->types_osm?->nom,
                'geonames_annee_mise_a_jour' => $preparation->geonames_annee_mise_a_jour,
                'gadm_version' => $preparation->gadm_version,
                'traite' => (bool) $preparation->traite,
            ])
            ->values();
    }

    public function home()
    {
        $metadata = $this->metadataCollections();

        return Inertia::render('Collect/HomePreparation', [
            'metadata' => $metadata['all'],
            'metadataForPreparation' => $metadata['available'],
            'typesOsm' => TypesOsm::orderBy('nom')->get(['id', 'nom']),
            'preparations' => $this->preparationRows(),
        ]);
    }

    // GET all
    public function index()
    {
        return response()->json(
            CollectePreparation::with('metadata.coupure.feuille')->get()
        );
    }

    // CREATE
    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => 'required|exists:metadata,id|unique:collecte_preparation,metadata_id',
            'imagerie' => 'nullable|string|max:150',
            'resolution' => 'nullable|string|max:100',
            'type_osm_id' => 'nullable|exists:types_osm,id',
            'geonames_annee_mise_a_jour' => 'nullable|integer',
            'gadm_version' => 'nullable|string|max:50',
        ]);

        $cp = DB::transaction(function () use ($validated) {
            return CollectePreparation::create([
                'id' => $this->nextId(CollectePreparation::class),
                ...$validated,
                'traite' => true,
            ]);
        });

        if ($request->expectsJson()) {
            return response()->json($cp, 201);
        }

        return redirect()
            ->route('collecte-preparation.home')
            ->with('success', 'Preparation créée avec succès.');
    }

    // SHOW
    public function show($id)
    {
        $cp = CollectePreparation::with('metadata')->find($id);

        if (!$cp) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($cp);
    }

    // UPDATE
    public function update(Request $request, CollectePreparation $preparation)
    {
        $validated = $request->validate([
            'metadata_id' => 'required|exists:metadata,id|unique:collecte_preparation,metadata_id,' . $preparation->id,
            'imagerie' => 'nullable|string|max:150',
            'resolution' => 'nullable|string|max:100',
            'type_osm_id' => 'nullable|exists:types_osm,id',
            'geonames_annee_mise_a_jour' => 'nullable|integer',
            'gadm_version' => 'nullable|string|max:50',
        ]);

        $preparation->update($validated);

        if ($request->expectsJson()) {
            return response()->json($preparation);
        }

        return redirect()
            ->route('collecte-preparation.home')
            ->with('success', 'Preparation modifiée avec succès.');
    }

    // DELETE
    public function destroy($id)
    {
        $cp = CollectePreparation::find($id);

        if (!$cp) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $cp->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
