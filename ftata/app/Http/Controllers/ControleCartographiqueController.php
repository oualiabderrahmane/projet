<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\ControleCartographique;
use App\Models\Metadata;
use App\Models\NiveauxControle;
use App\Models\TypesControle;

class ControleCartographiqueController extends Controller
{
    private function nextId(string $modelClass): int
    {
        $lastId = $modelClass::query()
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('id');

        return ((int) $lastId) + 1;
    }

    public function create()
    {
        $metadata = Metadata::with(['coupure.feuille', 'echelle'])
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

        $controlesEffectues = ControleCartographique::with([
            'metadata.coupure.feuille',
            'types_controle',
            'niveaux_controle',
        ])
            ->orderByDesc('id')
            ->get()
            ->map(fn (ControleCartographique $controle) => [
                'id' => $controle->id,
                'metadata_id' => $controle->metadata_id,
                'feuille_nom' => $controle->metadata?->coupure?->feuille?->nom,
                'coupure_nom' => $controle->metadata?->coupure?->nom,
                'type_controle_nom' => $controle->types_controle?->nom,
                'niveau_controle_nom' => $controle->niveaux_controle?->nom,
                'date_controle' => $controle->date_controle?->format('Y-m-d'),
                'date_edition' => $controle->date_edition?->format('Y-m-d'),
            ])
            ->values();

        return Inertia::render('Redaction/Controle', [
            'metadata' => $metadata,
            'typesControle' => TypesControle::orderBy('nom')->get(['id', 'nom']),
            'niveauxControle' => NiveauxControle::orderBy('nom')->get(['id', 'nom']),
            'controlesEffectues' => $controlesEffectues,
        ]);
    }

    public function index()
    {
        return ControleCartographique::with([
            'metadata.coupure.feuille',
            'types_controle',
            'niveaux_controle',
        ])->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => 'required|exists:metadata,id',
            'type_controle_id' => 'nullable|exists:types_controle,id',
            'niveau_controle_id' => 'nullable|exists:niveaux_controle,id',
            'date_controle' => 'nullable|date',
            'date_edition' => 'nullable|date',
        ]);

        $record = DB::transaction(function () use ($validated) {
            $record = ControleCartographique::where('metadata_id', $validated['metadata_id'])->first();
            $dateEdition = $validated['date_edition'] ?? null;

            $payload = [
                'metadata_id' => $validated['metadata_id'],
                'type_controle_id' => $validated['type_controle_id'] ?? null,
                'niveau_controle_id' => $validated['niveau_controle_id'] ?? null,
                'date_controle' => $validated['date_controle'] ?? null,
            ];

            if (!$record) {
                $record = new ControleCartographique([
                    ...$payload,
                    'date_edition' => $dateEdition,
                ]);
                $record->id = $this->nextId(ControleCartographique::class);
                $record->save();

                return $record;
            }

            if ($record->date_edition?->format('Y-m-d') !== $dateEdition) {
                $payload['date_edition'] = $dateEdition;
            }

            $record->update($payload);

            return $record;
        });

        if ($request->expectsJson()) {
            return response()->json($record, 201);
        }

        return redirect()
            ->route('controle-cartographique.create')
            ->with('success', 'Controle cartographique cree avec succes.');
    }

    public function show($id)
    {
        return ControleCartographique::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $record = ControleCartographique::findOrFail($id);

        $validated = $request->validate([
            'type_controle_id' => 'nullable|exists:types_controle,id',
            'niveau_controle_id' => 'nullable|exists:niveaux_controle,id',
            'date_controle' => 'nullable|date',
            'date_edition' => 'nullable|date',
        ]);

        $record->update($validated);

        return $record;
    }

    public function destroy($id)
    {
        return ControleCartographique::destroy($id);
    }
}
