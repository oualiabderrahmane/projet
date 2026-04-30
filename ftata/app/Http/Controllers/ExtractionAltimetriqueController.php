<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\ExtractionAltimetrique;
use App\Models\Metadata;
use App\Models\ModesExtraction;

class ExtractionAltimetriqueController extends Controller
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
                $query->whereDoesntHave('extraction_altimetriques');

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

    private function extractionRows()
    {
        return ExtractionAltimetrique::with([
            'metadata.coupure.feuille',
            'metadata.echelle',
            'modes_extraction',
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
                'echelle_id' => $extraction->metadata?->echelle?->id,
                'echelle_valeur' => $extraction->metadata?->echelle?->valeur,
                'mnt' => $extraction->mnt,
                'resolution' => $extraction->resolution,
                'logiciel_utilise' => $extraction->logiciel_utilise,
                'version_logiciel' => $extraction->version_logiciel,
                'mode_extraction_id' => $extraction->mode_extraction_id,
                'mode_extraction_nom' => $extraction->modes_extraction?->nom,
            ])
            ->values();
    }

    public function home()
    {
        return Inertia::render('Extraction/HomeExtraction', [
            'metadata' => $this->metadataRows(),
            'modesExtraction' => ModesExtraction::orderBy('nom')->get(['id', 'nom']),
            'extractions' => $this->extractionRows(),
        ]);
    }

    public function index()
    {
        return ExtractionAltimetrique::with('metadata.coupure.feuille')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => 'required|exists:metadata,id|unique:extraction_altimetrique,metadata_id',
            'mnt' => 'nullable|string|max:150',
            'resolution' => 'nullable|string|max:100',
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_extraction_id' => 'nullable|exists:modes_extraction,id',
        ]);

        $record = DB::transaction(function () use ($validated) {
            return ExtractionAltimetrique::create([
                'id' => $this->nextId(ExtractionAltimetrique::class),
                ...$validated,
            ]);
        });

        if ($request->expectsJson()) {
            return response()->json($record, 201);
        }

        return redirect()
            ->route('extraction.home')
            ->with('success', 'Extraction altimetrique creee avec succes.');
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
            'mnt' => 'nullable|string|max:150',
            'resolution' => 'nullable|string|max:100',
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_extraction_id' => 'nullable|exists:modes_extraction,id',
        ]);

        $record->update($validated);

        if ($request->expectsJson()) {
            return response()->json($record);
        }

        return redirect()
            ->route('extraction.home')
            ->with('success', 'Extraction altimetrique modifiee avec succes.');
    }

    public function destroy($id)
    {
        return ExtractionAltimetrique::destroy($id);
    }
}
