<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesPhaseFields;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Models\CompletementSpatial;
use App\Models\Format;
use App\Models\LogicielUtilise;
use App\Models\Metadata;
use App\Models\ModeRealisation;
use App\Models\TraitementVecteur;
use App\Models\Echelle;
class TraitementVecteurController extends Controller
{
    use UsesPhaseFields;

    private const TRAITEMENT_FORMATS = [
        'GDB',
        'MDB',
    ];

    private const TRAITEMENT_MODES = [
        'Intégration des données',
        'Traitement des données',
        'Intégration et traitement',
    ];



    private function pageData(): array
    {
        $metadata = $this->metadataCollections();

        return [
            'metadata' => $metadata['all'],
            'metadataForTraitement' => $metadata['available'],
            'modesRealisation' => $this->traitementModeRows(),
            'formats' => Format::whereIn('nom', self::TRAITEMENT_FORMATS)->orderBy('id')->get(['id', 'nom']),
            'logicielsUtilises' => LogicielUtilise::orderBy('id')->get(['id', 'nom']),
            'operateurs' => $this->operateurRows('traitment_vecteur'),
            'traitements' => $this->traitementRows(),
            'echelles'=>Echelle::all(['id', 'valeur']),
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
            foreach (self::TRAITEMENT_MODES as $oldName => $newName) {
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
                'coupure_label' => $metadata->coupure?->label,
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
            'format',
            'operateur',
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
                'coupure_label' => $traitement->metadata?->coupure?->label,
                'echelle_id' => $traitement->metadata?->echelle?->id,
                'echelle_valeur' => $traitement->metadata?->echelle?->valeur,
                ...$this->phaseRowFields($traitement),
                'logiciel_utilise' => $traitement->logiciel_utilise,
                'version_logiciel' => $traitement->version_logiciel,
                'mode_realisation_id' => $traitement->mode_realisation_id,
                'mode_realisation_nom' => $traitement->mode_realisation?->nom,
                'tolerance_topologique' => $traitement->tolerance_topologique,
                'format_id' => $traitement->format_id,
                'format_nom' => $traitement->format?->nom,
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
        return TraitementVecteur::with(['metadata.coupure.feuille', 'format'])->get();
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
            ...$this->phaseFieldRules('traitment_vecteur'),
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_realisation_id' => ['required', $this->modeRealisationRule()],
            'tolerance_topologique' => 'nullable|string|max:100',
            'format_id' => [
                'nullable',
                Rule::exists('formats', 'id')
                    ->where(fn ($query) => $query->whereIn('nom', self::TRAITEMENT_FORMATS)),
            ],
        ]);

        $record = DB::transaction(function () use ($validated) {
            $previous = CompletementSpatial::where('metadata_id', $validated['metadata_id'])->first();

            return TraitementVecteur::create([
                'id' => $this->nextId(TraitementVecteur::class),
                ...$validated,
                ...$this->automaticPhaseDates($previous),
                'traite' => true,
            ]);
        });

        if ($request->expectsJson()) {
            return response()->json($record, 201);
        }

        return redirect()
            ->route('traitement-vecteur.home')
            ->with('success', 'Traitement vecteur créé avec succès.');
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
            ...$this->phaseFieldRules('traitment_vecteur'),
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_realisation_id' => ['required', $this->modeRealisationRule()],
            'tolerance_topologique' => 'nullable|string|max:100',
            'format_id' => [
                'nullable',
                Rule::exists('formats', 'id')
                    ->where(fn ($query) => $query->whereIn('nom', self::TRAITEMENT_FORMATS)),
            ],
        ]);

        $previous = CompletementSpatial::where('metadata_id', $validated['metadata_id'])->first();

        $record->update([
            ...$validated,
            ...$this->automaticPhaseDates($previous, currentRecord: $record),
        ]);

        if ($request->expectsJson()) {
            return response()->json($record);
        }

        return redirect()
            ->route('traitement-vecteur.home')
            ->with('success', 'Traitement vecteur modifié avec succès.');
    }

    public function destroy(Request $request, $id)
    {
        try {
            $deleted = TraitementVecteur::destroy($id);
        } catch (\Throwable $exception) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Suppression impossible'], 409);
            }

            return redirect()
                ->route('traitement-vecteur.home')
                ->with('error', 'Suppression impossible : ce traitement est utilise ailleurs.');
        }

        if ($request->expectsJson()) {
            return response()->json(['deleted' => $deleted]);
        }

        return redirect()
            ->route('traitement-vecteur.home')
            ->with('success', 'Traitement supprime avec succes.');
    }
}
