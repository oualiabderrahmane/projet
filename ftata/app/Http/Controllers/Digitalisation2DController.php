<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Digitalisation2d;
use App\Models\Metadata;
use App\Models\ModesRealisation;

class Digitalisation2DController extends Controller
{
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
                $query->whereDoesntHave('digitalisation2ds');

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

    private function digitalisationRows()
    {
        return Digitalisation2d::with([
            'metadata.coupure.feuille',
            'metadata.echelle',
            'modes_realisation',
        ])
            ->orderByDesc('id')
            ->get()
            ->map(fn (Digitalisation2d $digitalisation) => [
                'id' => $digitalisation->id,
                'metadata_id' => $digitalisation->metadata_id,
                'feuille_id' => $digitalisation->metadata?->coupure?->feuille?->id,
                'feuille_nom' => $digitalisation->metadata?->coupure?->feuille?->nom,
                'coupure_id' => $digitalisation->metadata?->coupure?->id,
                'coupure_nom' => $digitalisation->metadata?->coupure?->nom,
                'echelle_id' => $digitalisation->metadata?->echelle?->id,
                'echelle_valeur' => $digitalisation->metadata?->echelle?->valeur,
                'logiciel_utilise' => $digitalisation->logiciel_utilise,
                'version_logiciel' => $digitalisation->version_logiciel,
                'mode_realisation_id' => $digitalisation->mode_realisation_id,
                'mode_realisation_nom' => $digitalisation->modes_realisation?->nom,
            ])
            ->values();
    }

    public function home()
    {
        return Inertia::render('Degitalisation/HomeDigitalisation', [
            'metadata' => $this->metadataRows(),
            'modesRealisation' => ModesRealisation::orderBy('nom')->get(['id', 'nom']),
            'digitalisations' => $this->digitalisationRows(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Degitalisation/Digitalisation', [
            'metadata' => $this->metadataRows(),
            'modesRealisation' => ModesRealisation::orderBy('nom')->get(['id', 'nom']),
        ]);
    }

    public function index()
    {
        return Digitalisation2d::with('metadata.coupure.feuille')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => 'required|exists:metadata,id|unique:digitalisation_2d,metadata_id',
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_realisation_id' => 'nullable|exists:modes_realisation,id',
        ]);

        $record = DB::transaction(function () use ($validated) {
            return Digitalisation2d::create([
                'id' => $this->nextId(Digitalisation2d::class),
                ...$validated,
            ]);
        });

        if ($request->expectsJson()) {
            return response()->json($record, 201);
        }

        return redirect()
            ->route('digitalisation.home')
            ->with('success', 'Digitalisation creee avec succes.');
    }

    public function show($id)
    {
        return Digitalisation2d::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $record = Digitalisation2d::findOrFail($id);

        $validated = $request->validate([
            'metadata_id' => 'required|exists:metadata,id|unique:digitalisation_2d,metadata_id,' . $record->id,
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_realisation_id' => 'nullable|exists:modes_realisation,id',
        ]);

        $record->update($validated);

        if ($request->expectsJson()) {
            return response()->json($record);
        }

        return redirect()
            ->route('digitalisation.home')
            ->with('success', 'Digitalisation modifiee avec succes.');
    }

    public function destroy($id)
    {
        return Digitalisation2d::destroy($id);
    }
}
