<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesPhaseFields;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use App\Models\ControleCartographique;
use App\Models\Echelle;
use App\Models\Metadata;
use App\Models\NiveauxControle;
use App\Models\RedactionCartographique;
use App\Models\TypesControle;

class ControleCartographiqueController extends Controller
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

    public function create()
    {
        $metadata = Metadata::with(['coupure.feuille', 'echelle'])
            ->whereHas('redaction_cartographiques', fn ($query) => $query->where('traite', true))
            ->orderBy('id')
            ->get()
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

        $controlesEffectues = ControleCartographique::with([
            'metadata.coupure.feuille',
            'metadata.echelle',
            'types_controle',
            'niveaux_controle',
            'operateur',
        ])
            ->orderByDesc('id')
            ->get()
            ->map(fn (ControleCartographique $controle) => [
                'id' => $controle->id,
                'metadata_id' => $controle->metadata_id,
                'feuille_id' => $controle->metadata?->coupure?->feuille?->id,
                'feuille_nom' => $controle->metadata?->coupure?->feuille?->nom,
                'coupure_id' => $controle->metadata?->coupure?->id,
                'coupure_nom' => $controle->metadata?->coupure?->nom,
                'coupure_label' => $controle->metadata?->coupure?->label,
                'echelle_id' => $controle->metadata?->echelle?->id,
                'echelle_valeur' => $controle->metadata?->echelle?->valeur,
                'type_controle_id' => $controle->type_controle_id,
                'type_controle_nom' => $controle->types_controle?->nom,
                'niveau_controle_id' => $controle->niveau_controle_id,
                'niveau_controle_nom' => $controle->niveaux_controle?->nom,
                ...$this->phaseRowFields($controle),
                'date_controle' => $controle->date_controle?->format('Y-m-d'),
                'date_edition' => $controle->date_edition?->format('Y-m-d'),
            ])
            ->values();

        return Inertia::render('Redaction/Controle', [
            'metadata' => $metadata,
            'echelles' => Echelle::orderBy('id')->get(['id', 'valeur']),
            'typesControle' => TypesControle::orderBy('id')->get(['id', 'nom']),
            'niveauxControle' => NiveauxControle::orderBy('nom')->get(['id', 'nom']),
            'operateurs' => $this->operateurRows('controle'),
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
            'metadata_id' => [
                'required',
                'exists:metadata,id',
                Rule::exists('redaction_cartographique', 'metadata_id')
                    ->where(fn ($query) => $query->where('traite', true)),
            ],
            'type_controle_id' => 'required|exists:types_controle,id',
            'niveau_controle_id' => 'required|exists:niveaux_controle,id',
            ...$this->phaseFieldRules('controle'),
            'date_controle' => 'nullable|date',
            'date_edition' => 'nullable|date',
        ]);

        $record = DB::transaction(function () use ($validated) {
            $existingControle = ControleCartographique::where('metadata_id', $validated['metadata_id'])
                ->where('type_controle_id', $validated['type_controle_id'])
                ->first();

            if ($existingControle) {
                throw ValidationException::withMessages([
                    'type_controle_id' => 'Ce contrôle est déjà sauvegardé et ne peut pas être modifié.',
                ]);
            }

            $previous = RedactionCartographique::where('metadata_id', $validated['metadata_id'])->first();
            $dateEdition = $validated['date_edition']
                ?? ControleCartographique::where('metadata_id', $validated['metadata_id'])
                    ->whereNotNull('date_edition')
                    ->value('date_edition');

            $record = new ControleCartographique([
                'metadata_id' => $validated['metadata_id'],
                'type_controle_id' => $validated['type_controle_id'],
                'niveau_controle_id' => $validated['niveau_controle_id'],
                'operateur_id' => $validated['operateur_id'] ?? null,
                ...$this->automaticPhaseDates($previous),
                'date_controle' => $validated['date_controle'] ?? null,
                'date_edition' => $dateEdition,
            ]);

            $record->id = $this->nextId(ControleCartographique::class);
            $record->save();

            return $record;
        });

        if ($request->expectsJson()) {
            return response()->json($record, 201);
        }

        return redirect()
            ->route('controle-cartographique.create')
            ->with('success', 'Contrôle cartographique créé avec succès.');
    }

    public function updateDateEdition(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => [
                'required',
                'exists:metadata,id',
                Rule::exists('controle_cartographique', 'metadata_id'),
            ],
            'date_edition' => 'required|date',
        ]);

        ControleCartographique::where('metadata_id', $validated['metadata_id'])
            ->update(['date_edition' => $validated['date_edition']]);

        if ($request->expectsJson()) {
            return response()->json(['date_edition' => $validated['date_edition']]);
        }

        return redirect()
            ->route('controle-cartographique.create')
            ->with('success', 'Date d\'édition enregistrée avec succès.');
    }

    public function show($id)
    {
        return ControleCartographique::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        ControleCartographique::findOrFail($id);

        throw ValidationException::withMessages([
            'controle' => 'Un contrôle sauvegardé ne peut pas être modifié.',
        ]);
    }

    public function destroy(Request $request, $id)
    {
        try {
            $deleted = ControleCartographique::destroy($id);
        } catch (\Throwable $exception) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Suppression impossible'], 409);
            }

            return redirect()
                ->route('controle-cartographique.create')
                ->with('error', 'Suppression impossible : ce controle est utilise ailleurs.');
        }

        if ($request->expectsJson()) {
            return response()->json(['deleted' => $deleted]);
        }

        return redirect()
            ->route('controle-cartographique.create')
            ->with('success', 'Controle supprime avec succes.');
    }
}
