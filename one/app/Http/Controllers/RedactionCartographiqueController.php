<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesPhaseFields;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Models\Format;
use App\Models\LogicielUtilise;
use App\Models\Metadata;
use App\Models\RedactionCartographique;
use App\Models\TraitementVecteur;
use App\Models\Echelle;
class RedactionCartographiqueController extends Controller
{
    use UsesPhaseFields;

    private const REDACTION_FORMATS = [
        'Geotif',
        'pdf',
        'ecw',
        'Autre',
    ];

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
                'coupure_label' => $metadata->coupure?->label,
                'echelle_id' => $metadata->echelle?->id,
                'echelle_valeur' => $metadata->echelle?->valeur,
            ])
            ->values();
    }

    private function metadataCollections(?int $includeMetadataId = null): array
    {
        $all = Metadata::with(['coupure.feuille', 'echelle'])
            ->whereHas('traitement_vecteurs', fn ($query) => $query->where('traite', true))
            ->orderBy('id')
            ->get();

        $usedMetadataIds = RedactionCartographique::query()
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

        $redactions = RedactionCartographique::with(['metadata.coupure.feuille', 'metadata.echelle', 'format', 'operateur'])
            ->orderByDesc('id')
            ->get()
            ->map(fn (RedactionCartographique $record) => [
                'id' => $record->id,
                'metadata_id' => $record->metadata_id,
                'feuille_id' => $record->metadata?->coupure?->feuille?->id,
                'feuille_nom' => $record->metadata?->coupure?->feuille?->nom,
                'coupure_id' => $record->metadata?->coupure?->id,
                'coupure_nom' => $record->metadata?->coupure?->nom,
                'coupure_label' => $record->metadata?->coupure?->label,
                'echelle_id' => $record->metadata?->echelle?->id,
                'echelle_valeur' => $record->metadata?->echelle?->valeur,
                ...$this->phaseRowFields($record),
                'logiciel_utilise' => $record->logiciel_utilise,
                'version_logiciel' => $record->version_logiciel,
                'format_id' => $record->format_id,
                'format_nom' => $record->format?->nom,
                'traite' => (bool) $record->traite,
            ])
            ->values();

        return [
            'metadata' => $metadata['all'],
            'metadataForRedaction' => $metadata['available'],
            'formats' => Format::whereIn('nom', self::REDACTION_FORMATS)->orderBy('id')->get(['id', 'nom']),
            'logicielsUtilises' => LogicielUtilise::orderBy('id')->get(['id', 'nom']),
            'operateurs' => $this->operateurRows('redaction'),
            'redactions' => $redactions,
            'echelles'=>Echelle::all(['id', 'valeur']),
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
        return RedactionCartographique::with('format')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => [
                'required',
                'exists:metadata,id',
                'unique:redaction_cartographique,metadata_id',
                Rule::exists('traitement_vecteur', 'metadata_id')
                    ->where(fn ($query) => $query->where('traite', true)),
            ],
            ...$this->phaseFieldRules('redaction'),
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'format_id' => [
                'nullable',
                Rule::exists('formats', 'id')
                    ->where(fn ($query) => $query->whereIn('nom', self::REDACTION_FORMATS)),
            ],
        ]);

        $record = DB::transaction(function () use ($validated) {
            $previous = TraitementVecteur::where('metadata_id', $validated['metadata_id'])->first();

            return RedactionCartographique::create([
                'id' => $this->nextId(RedactionCartographique::class),
                ...$validated,
                ...$this->automaticPhaseDates($previous),
                'traite' => true,
            ]);
        });

        if ($request->expectsJson()) {
            return response()->json($record, 201);
        }

        return redirect()
            ->route('redaction-cartographique.home')
            ->with('success', 'Rédaction cartographique créée avec succès.');
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
            ...$this->phaseFieldRules('redaction'),
            'format_id' => [
                'nullable',
                Rule::exists('formats', 'id')
                    ->where(fn ($query) => $query->whereIn('nom', self::REDACTION_FORMATS)),
            ],
        ]);

        $previous = TraitementVecteur::where('metadata_id', $record->metadata_id)->first();

        $record->update([
            ...$validated,
            ...$this->automaticPhaseDates($previous, currentRecord: $record),
        ]);

        if ($request->expectsJson()) {
            return $record;
        }

        return redirect()
            ->route('redaction-cartographique.home')
            ->with('success', 'Rédaction cartographique modifiée avec succès.');
    }

    public function destroy(Request $request, $id)
    {
        try {
            $deleted = RedactionCartographique::destroy($id);
        } catch (\Throwable $exception) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Suppression impossible'], 409);
            }

            return redirect()
                ->route('redaction-cartographique.home')
                ->with('error', 'Suppression impossible : cette redaction est utilisee ailleurs.');
        }

        if ($request->expectsJson()) {
            return response()->json(['deleted' => $deleted]);
        }

        return redirect()
            ->route('redaction-cartographique.home')
            ->with('success', 'Redaction supprimee avec succes.');
    }
}
