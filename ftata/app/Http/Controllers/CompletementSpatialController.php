<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Models\CompletementSpatial;
use App\Models\Metadata;
use App\Models\TypesDonneesSpatiale;

class CompletementSpatialController extends Controller
{
    private function formatMetadataRows(Collection $metadataRows)
    {
        return $metadataRows
            ->map(fn (Metadata $m) => [
                'id' => $m->id,
                'feuille_id' => $m->coupure?->feuille?->id,
                'feuille_nom' => $m->coupure?->feuille?->nom,
                'coupure_id' => $m->coupure?->id,
                'coupure_nom' => $m->coupure?->nom,
                'echelle_valeur' => $m->echelle?->valeur,
            ])
            ->values();
    }

    private function metadataCollections(?int $includeMetadataId = null): array
    {
        $all = Metadata::with(['coupure.feuille', 'echelle'])
            ->whereHas('digitalisation2ds', fn ($query) => $query->where('traite', true))
            ->orderBy('id')
            ->get();

        $usedMetadataIds = CompletementSpatial::query()
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

    private function pageData(): array
    {
        $metadata = $this->metadataCollections();

        $completements = CompletementSpatial::with([
            'metadata.coupure.feuille',
            'metadata.echelle',
            'types_donnees_spatiales',
        ])->get()->map(fn ($c) => [
            'id'                      => $c->id,
            'metadata_id'             => $c->metadata_id,
            'feuille_id'              => $c->metadata?->coupure?->feuille?->id,
            'feuille_nom'             => $c->metadata?->coupure?->feuille?->nom,
            'coupure_id'              => $c->metadata?->coupure?->id,
            'coupure_nom'             => $c->metadata?->coupure?->nom,
            'echelle_id'              => $c->metadata?->echelle?->id,
            'echelle_valeur'          => $c->metadata?->echelle?->valeur,
            'traite'                  => (bool) $c->traite,
            'types_donnees_spatiales' => $c->types_donnees_spatiales->map(fn ($t) => [
                'id'  => $t->id,
                'nom' => $t->nom,
            ])->values(),
        ])->values();

        return [
            'metadata' => $metadata['all'],
            'metadataForCompletement' => $metadata['available'],
            'typesDonnees' => TypesDonneesSpatiale::orderBy('nom')->get(['id', 'nom']),
            'completements' => $completements,
        ];
    }

    private function normalizeTypeDonneesIds(array $validated): array
    {
        $ids = $validated['type_donnees_ids'] ?? [];

        if (empty($ids) && !empty($validated['type_donnees_id'])) {
            $ids = [$validated['type_donnees_id']];
        }

        return collect($ids)
            ->filter(fn ($id) => $id !== null && $id !== '')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    private function nextId(string $modelClass): int
    {
        $lastId = $modelClass::query()
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('id');

        return ((int) $lastId) + 1;
    }

    public function home()
    {
        return Inertia::render('Completment-spatial/HomeCompletment', $this->pageData());
    }

    public function create()
    {
        return $this->home();
    }

    public function index()
    {
        return CompletementSpatial::with([
            'metadata.coupure.feuille',
            'types_donnees_spatiales',
        ])->get();
    }

    public function store(Request $request)
{
    $validated = $request->validate([
        'metadata_id' => [
            'required',
            'exists:metadata,id',
            'unique:completement_spatial,metadata_id',
            Rule::exists('digitalisation_2d', 'metadata_id')
                ->where(fn ($query) => $query->where('traite', true)),
        ],
        'type_donnees_ids' => 'required|array|min:1',
        'type_donnees_ids.*' => 'exists:types_donnees_spatiales,id',
    ]);

    $record = DB::transaction(function () use ($validated) {
        $record = CompletementSpatial::create([
            'id' => $this->nextId(CompletementSpatial::class),
            'metadata_id' => $validated['metadata_id'],
            'traite' => true,
        ]);

        $record->types_donnees_spatiales()->sync($validated['type_donnees_ids']);

        return $record;
    });

    if ($request->expectsJson()) {
        return response()->json(
            $record->load('types_donnees_spatiales'),
            201
        );
    }

    return redirect()
        ->route('completment-spatial.create')
        ->with('success', 'Completement spatial cree avec succes.');
}
    public function show($id)
    {
        return CompletementSpatial::with('types_donnees_spatiales')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $record = CompletementSpatial::findOrFail($id);

        $validated = $request->validate([
            'type_donnees_id' => 'nullable|exists:types_donnees_spatiales,id',
            'type_donnees_ids' => 'nullable|array',
            'type_donnees_ids.*' => 'exists:types_donnees_spatiales,id',
        ]);

        $typeDonneesIds = $this->normalizeTypeDonneesIds($validated);

        $record->update([
            'type_donnees_id' => $typeDonneesIds[0] ?? null,
        ]);

        $record->types_donnees_spatiales()->sync($typeDonneesIds);

        if ($request->expectsJson()) {
            return $record->load('types_donnees_spatiales');
        }

        return redirect()
            ->route('completment-spatial.home')
            ->with('success', 'Completement spatial mis a jour avec succes.');
    }

    public function destroy($id)
    {
        return CompletementSpatial::destroy($id);
    }
}
