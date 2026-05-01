<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Models\Metadata;
use App\Models\ModeRealisation;
use App\Models\TraitementVecteur;

class TraitementVecteurController extends Controller
{
    private const TRAITEMENT_MODES = [
        'Intégration des données',
        'Traitement des données',
        'Intégration et traitement',
    ];

    private const TRAITEMENT_MODE_RENAMES = [
        'Integration' => 'Intégration des données',
        'Traitement' => 'Traitement des données',
        'Les deux' => 'Intégration et traitement',
    ];

    private function pageData(): array
    {
        $metadata = $this->metadataCollections();

        return [
            'metadata' => $metadata['all'],
            'metadataForTraitement' => $metadata['available'],
            'modesRealisation' => $this->traitementModeRows(),
            'traitements' => $this->traitementRows(),
        ];
    }

    private function nextId(string $modelClass): int
    {
        $lastId = $modelClass::query()
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('id');

        return ((int) $lastId) + 1;
    }

    private function ensureTraitementModes(): void
    {
        DB::transaction(function () {
            foreach (self::TRAITEMENT_MODE_RENAMES as $oldName => $newName) {
                ModeRealisation::where('nom', $oldName)->update(['nom' => $newName]);
            }

            $nextId = $this->nextId(ModeRealisation::class);

            foreach (self::TRAITEMENT_MODES as $mode) {
                if (ModeRealisation::where('nom', $mode)->exists()) {
                    continue;
                }

                $record = new ModeRealisation();
                $record->id = $nextId++;
                $record->nom = $mode;
                $record->save();
            }
        });
    }

    private function traitementModeRows()
    {
        $this->ensureTraitementModes();

        return ModeRealisation::whereIn('nom', self::TRAITEMENT_MODES)
            ->get(['id', 'nom'])
            ->sortBy(fn (ModeRealisation $mode) => array_search($mode->nom, self::TRAITEMENT_MODES, true))
            ->values();
    }

    private function modeRealisationRule()
    {
        $this->ensureTraitementModes();

        return Rule::exists('mode_realisation', 'id')
            ->where(fn ($query) => $query->whereIn('nom', self::TRAITEMENT_MODES));
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
            ->whereHas('completement_spatials', fn ($relation) => $relation->where('traite', true))
            ->orderBy('id')
            ->get();

        $usedMetadataIds = TraitementVecteur::query()
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

    private function traitementRows()
    {
        return TraitementVecteur::with([
            'metadata.coupure.feuille',
            'metadata.echelle',
            'mode_realisation',
        ])
            ->orderByDesc('id')
            ->get()
            ->map(fn (TraitementVecteur $traitement) => [
                'id' => $traitement->id,
                'metadata_id' => $traitement->metadata_id,
                'feuille_id' => $traitement->metadata?->coupure?->feuille?->id,
                'feuille_nom' => $traitement->metadata?->coupure?->feuille?->nom,
                'coupure_id' => $traitement->metadata?->coupure?->id,
                'coupure_nom' => $traitement->metadata?->coupure?->nom,
                'echelle_id' => $traitement->metadata?->echelle?->id,
                'echelle_valeur' => $traitement->metadata?->echelle?->valeur,
                'logiciel_utilise' => $traitement->logiciel_utilise,
                'version_logiciel' => $traitement->version_logiciel,
                'mode_realisation_id' => $traitement->mode_realisation_id,
                'mode_realisation_nom' => $traitement->mode_realisation?->nom,
                'tolerance_topologique' => $traitement->tolerance_topologique,
                'traite' => (bool) $traitement->traite,
            ])
            ->values();
    }

    public function home()
    {
        return Inertia::render('Traitment-vecteur/HomeTraitment', $this->pageData());
    }

    public function create()
    {
        return $this->home();
    }

    public function index()
    {
        return TraitementVecteur::with('metadata.coupure.feuille')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => [
                'required',
                'exists:metadata,id',
                'unique:traitement_vecteur,metadata_id',
                Rule::exists('completement_spatial', 'metadata_id')
                    ->where(fn ($query) => $query->where('traite', true)),
            ],
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_realisation_id' => ['required', $this->modeRealisationRule()],
            'tolerance_topologique' => 'nullable|string|max:100',
        ]);

        $record = DB::transaction(function () use ($validated) {
            return TraitementVecteur::create([
                'id' => $this->nextId(TraitementVecteur::class),
                ...$validated,
                'traite' => true,
            ]);
        });

        if ($request->expectsJson()) {
            return response()->json($record, 201);
        }

        return redirect()
            ->route('traitement-vecteur.home')
            ->with('success', 'Traitement vecteur cree avec succes.');
    }

    public function show($id)
    {
        return TraitementVecteur::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $record = TraitementVecteur::findOrFail($id);

        $validated = $request->validate([
            'metadata_id' => 'required|exists:metadata,id|unique:traitement_vecteur,metadata_id,' . $record->id,
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_realisation_id' => ['required', $this->modeRealisationRule()],
            'tolerance_topologique' => 'nullable|string|max:100',
        ]);

        $record->update($validated);

        if ($request->expectsJson()) {
            return response()->json($record);
        }

        return redirect()
            ->route('traitement-vecteur.home')
            ->with('success', 'Traitement vecteur modifie avec succes.');
    }

    public function destroy($id)
    {
        return TraitementVecteur::destroy($id);
    }
}
