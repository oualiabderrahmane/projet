<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Metadata;
use App\Models\ModeRealisation;
use App\Models\TraitementVecteur;

class TraitementVecteurController extends Controller
{
    private function pageData(): array
    {
        return [
            'metadata' => $this->metadataRows(),
            'modesRealisation' => ModeRealisation::orderBy('nom')->get(['id', 'nom']),
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

    private function metadataRows(?int $includeMetadataId = null)
    {
        return Metadata::with(['coupure.feuille', 'echelle'])
            ->where(function ($query) use ($includeMetadataId) {
                $query->whereDoesntHave('traitement_vecteurs');

                if ($includeMetadataId) {
                    $query->orWhere('id', $includeMetadataId);
                }
            })
            ->orderBy('id')
            ->get()
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
            'metadata_id' => 'required|exists:metadata,id|unique:traitement_vecteur,metadata_id',
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_realisation_id' => 'nullable|exists:mode_realisation,id',
            'tolerance_topologique' => 'nullable|string|max:100',
        ]);

        $record = DB::transaction(function () use ($validated) {
            return TraitementVecteur::create([
                'id' => $this->nextId(TraitementVecteur::class),
                ...$validated,
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
            'mode_realisation_id' => 'nullable|exists:mode_realisation,id',
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
