<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Echelle;
use App\Models\Feuille;
use App\Models\Coupure;
use App\Models\Metadata;
use App\Models\Pay;
use App\Models\SystemesReference;
use App\Models\TypesReleve;

class MetadataController extends Controller
{
    private function nextId(string $modelClass): int
    {
        $lastId = $modelClass::query()
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('id');

        return ((int) $lastId) + 1;
    }
    private function formOptions(): array
    {
        return [
            'pays' => Pay::orderBy('nom')->get(['id', 'nom']),
            'systemesReference' => SystemesReference::orderBy('nom')->get(['id', 'nom', 'type', 'zone']),
            'typesReleve' => TypesReleve::orderBy('nom')->get(['id', 'nom']),
            'echelles' => Echelle::orderBy('id')->get(['id', 'valeur']),
        ];
    }
private function metadataRows(Request $request)
{
    $filters = $request->only([
        'feuille_id',
        'coupure_id',
        'pays_id',
        'systeme_reference_id',
        'type_releve_id',
        'echelle_id',
    ]);

    return Metadata::query()
        ->with([
            'coupure.feuille',
            'pay',
            'systemes_reference',
            'types_releve',
            'echelle',
        ])

        ->when($filters['feuille_id'] ?? null, function ($query, $feuilleId) {
            $query->whereHas('coupure.feuille', function ($q) use ($feuilleId) {
                $q->where('id', $feuilleId);
            });
        })

        ->when($filters['coupure_id'] ?? null, function ($query, $coupureId) {
            $query->where('coupure_id', $coupureId);
        })

        ->when($filters['pays_id'] ?? null, function ($query, $paysId) {
            $query->where('pays_id', $paysId);
        })

        ->when($filters['systeme_reference_id'] ?? null, function ($query, $systemeId) {
            $query->where('systeme_reference_id', $systemeId);
        })

        ->when($filters['type_releve_id'] ?? null, function ($query, $typeReleveId) {
            $query->where('types_releve_id', $typeReleveId);
        })

        ->when($filters['echelle_id'] ?? null, function ($query, $echelleId) {
            $query->where('echelle_id', $echelleId);
        })
        ->orderByDesc('date_creation_metadata')
        ->orderByDesc('id')
        ->get()
        ->map(fn (Metadata $metadata) => [
            'id' => $metadata->id,
            'feuille_id' => $metadata->coupure?->feuille?->id,
            'feuille_nom' => $metadata->coupure?->feuille?->nom,

            'coupure_id' => $metadata->coupure?->id,
            'coupure_nom' => $metadata->coupure?->nom,

            'date_creation_metadata' => $metadata->date_creation_metadata?->format('Y-m-d'),

            'pays_id' => $metadata->pay?->id,
            'pays_nom' => $metadata->pay?->nom,

            'systeme_reference_id' => $metadata->systemes_reference?->id,
            'systeme_reference_nom' => $metadata->systemes_reference?->nom,
            'systeme_reference_type' => $metadata->systemes_reference?->type,
            'systeme_reference_zone' => $metadata->systemes_reference?->zone,
            'systeme_reference_label' => collect([
                $metadata->systemes_reference?->nom,
                $metadata->systemes_reference?->type,
                $metadata->systemes_reference?->zone
                    ? 'Zone ' . $metadata->systemes_reference?->zone
                    : null,
            ])->filter()->join(' - '),

            'type_releve_id' => $metadata->types_releve?->id,
            'type_releve_nom' => $metadata->types_releve?->nom,

            'echelle_id' => $metadata->echelle?->id,
            'echelle_valeur' => $metadata->echelle?->valeur,
        ])
        ->values();
}
//sa pour laffichage des metadata avec filters i use id pour les feuilles et coupures dans la table metadata pour faciliter les filtres et les relations
    public function home(Request $request)
    {
        return Inertia::render('Collect/Metadata/MetadataHome', [
            ...$this->formOptions(),
            'metadata' => $this->metadataRows($request),
            'filters' => $request->only([
                'feuille_id',
                'coupure_id',
                'pays_id',
                'systeme_reference_id',
                'type_releve_id',
                'echelle_id',
            ]),
        ]);
    }



    public function index()
{
    return response()->json(
        Metadata::with('coupure.feuille')->get()
    );
}
public function show($id)
{
    $metadata = Metadata::with('coupure.feuille')->find($id);

    if (!$metadata) {
        return response()->json(['message' => 'Metadata not found'], 404);
    }

    return response()->json($metadata);
}
public function byFeuille($feuille_id)
{
    $metadata = Metadata::whereHas('coupure', function ($q) use ($feuille_id) {
        $q->where('feuille_id', $feuille_id);
    })->with('coupure.feuille')->get();

    return response()->json($metadata);
}
public function byCoupure($coupure_id)
{
    $metadata = Metadata::with('coupure.feuille')
        ->where('coupure_id', $coupure_id)
        ->get();

    return response()->json($metadata);
}
    public function store(Request $request)
{
    $validated = $request->validate([
        'feuille_nom' => 'required|string|max:100',
        'coupure_nom' => 'required|string|max:100',
        'pays_id' => 'nullable|exists:pays,id',
        'systeme_reference_id' => 'nullable|exists:systemes_reference,id',
        'type_releve_id' => 'nullable|exists:types_releve,id',
        'echelle_id' => 'nullable|exists:echelles,id',
        'date_creation_metadata' => 'required|date'
    ]);

    $metadata = DB::transaction(function () use ($validated) {
        $feuilleNom = trim($validated['feuille_nom']);
        $coupureNom = trim($validated['coupure_nom']);

        // 1. Check or create Feuille
        $feuille = Feuille::where('nom', $feuilleNom)->first();

        if (!$feuille) {
            $feuille = Feuille::create([
                'id' => $this->nextId(Feuille::class),
                'nom' => $feuilleNom
            ]);
        }

        // 2. Check or create Coupure under this Feuille
        $coupure = Coupure::where('nom', $coupureNom)
            ->where('feuille_id', $feuille->id)
            ->first();

        if (!$coupure) {
            $coupure = Coupure::create([
                'id' => $this->nextId(Coupure::class),
                'nom' => $coupureNom,
                'feuille_id' => $feuille->id
            ]);
        }

        // 3. Create Metadata (no need to check usually)
        return Metadata::create([
            'id' => $this->nextId(Metadata::class),
            'coupure_id' => $coupure->id,
            'pays_id' => $validated['pays_id'] ?? null,
            'systeme_reference_id' => $validated['systeme_reference_id'] ?? null,
            'type_releve_id' => $validated['type_releve_id'] ?? null,
            'echelle_id' => $validated['echelle_id'] ?? null,
            'date_creation_metadata' => $validated['date_creation_metadata']
        ]);
    });

    if ($request->expectsJson()) {
        return response()->json($metadata->load('coupure.feuille'), 201);
    }

    return redirect()
        ->route('metadata.home')
        ->with('success', 'Metadata cree avec succes.');
}

public function update(Request $request, Metadata $metadata)
{
    $validated = $request->validate([
        'feuille_nom' => 'required|string|max:100',
        'coupure_nom' => 'required|string|max:100',
        'pays_id' => 'nullable|exists:pays,id',
        'systeme_reference_id' => 'nullable|exists:systemes_reference,id',
        'type_releve_id' => 'nullable|exists:types_releve,id',
        'echelle_id' => 'nullable|exists:echelles,id',
        'date_creation_metadata' => 'required|date'
    ]);

    DB::transaction(function () use ($validated, $metadata) {
        $feuilleNom = trim($validated['feuille_nom']);
        $coupureNom = trim($validated['coupure_nom']);
        $feuille = Feuille::where('nom', $feuilleNom)->first();

        if (!$feuille) {
            $feuille = Feuille::create([
                'id' => $this->nextId(Feuille::class),
                'nom' => $feuilleNom
            ]);
        }

        $coupure = Coupure::where('nom', $coupureNom)
            ->where('feuille_id', $feuille->id)
            ->first();

        if (!$coupure) {
            $coupure = Coupure::create([
                'id' => $this->nextId(Coupure::class),
                'nom' => $coupureNom,
                'feuille_id' => $feuille->id
            ]);
        }

        $metadata->update([
            'coupure_id' => $coupure->id,
            'pays_id' => $validated['pays_id'] ?? null,
            'systeme_reference_id' => $validated['systeme_reference_id'] ?? null,
            'type_releve_id' => $validated['type_releve_id'] ?? null,
            'echelle_id' => $validated['echelle_id'] ?? null,
            'date_creation_metadata' => $validated['date_creation_metadata']
        ]);
    });

    return redirect()
        ->route('metadata.home')
        ->with('success', 'Metadata modifie avec succes.');
}
}
