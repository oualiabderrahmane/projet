<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Metadata;
use App\Models\RedactionCartographique;

class RedactionCartographiqueController extends Controller
{
    private function nextId(string $modelClass): int
    {
        $lastId = $modelClass::query()
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('id');

        return ((int) $lastId) + 1;
    }

    private function pageData(): array
    {
        $metadata = Metadata::with(['coupure.feuille', 'echelle'])
            ->whereDoesntHave('redaction_cartographiques')
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

        $redactions = RedactionCartographique::with(['metadata.coupure.feuille', 'metadata.echelle'])
            ->orderByDesc('id')
            ->get()
            ->map(fn (RedactionCartographique $record) => [
                'id' => $record->id,
                'metadata_id' => $record->metadata_id,
                'feuille_id' => $record->metadata?->coupure?->feuille?->id,
                'feuille_nom' => $record->metadata?->coupure?->feuille?->nom,
                'coupure_id' => $record->metadata?->coupure?->id,
                'coupure_nom' => $record->metadata?->coupure?->nom,
                'echelle_id' => $record->metadata?->echelle?->id,
                'echelle_valeur' => $record->metadata?->echelle?->valeur,
                'logiciel_utilise' => $record->logiciel_utilise,
                'version_logiciel' => $record->version_logiciel,
            ])
            ->values();

        return [
            'metadata' => $metadata,
            'redactions' => $redactions,
        ];
    }

    public function home()
    {
        return Inertia::render('Redaction/Redaction', $this->pageData());
    }

    public function create()
    {
        return $this->home();
    }

    public function index()
    {
        return RedactionCartographique::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => 'required|exists:metadata,id|unique:redaction_cartographique,metadata_id',
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
        ]);

        $record = DB::transaction(function () use ($validated) {
            return RedactionCartographique::create([
                'id' => $this->nextId(RedactionCartographique::class),
                ...$validated,
            ]);
        });

        if ($request->expectsJson()) {
            return response()->json($record, 201);
        }

        return redirect()
            ->route('redaction-cartographique.home')
            ->with('success', 'Redaction cartographique creee avec succes.');
    }

    public function show($id)
    {
        return RedactionCartographique::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $record = RedactionCartographique::findOrFail($id);

        $validated = $request->validate([
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
        ]);

        $record->update($validated);

        if ($request->expectsJson()) {
            return $record;
        }

        return redirect()
            ->route('redaction-cartographique.home')
            ->with('success', 'Redaction cartographique modifiee avec succes.');
    }

    public function destroy($id)
    {
        return RedactionCartographique::destroy($id);
    }
}
