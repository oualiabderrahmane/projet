<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Models\Digitalisation2d;
use App\Models\Format;
use App\Models\Metadata;
use App\Models\ModesRealisation;

class Digitalisation2DController extends Controller
{
    private const DIGITALISATION_FORMATS = [
        'Dxf',
        'Dgm',
        'Shp',
        'GDB',
        'MDB',
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
                'echelle_id' => $metadata->echelle?->id,
                'echelle_valeur' => $metadata->echelle?->valeur,
            ])
            ->values();
    }

    private function metadataCollections(?int $includeMetadataId = null): array
    {
        $all = Metadata::with(['coupure.feuille', 'echelle'])
            ->whereHas('extraction_altimetriques', fn ($relation) => $relation->where('traite', true))
            ->orderBy('id')
            ->get();

        $usedMetadataIds = Digitalisation2d::query()
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

    private function digitalisationRows()
    {
        return Digitalisation2d::with([
            'metadata.coupure.feuille',
            'metadata.echelle',
            'modes_realisation',
            'format',
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
                'format_id' => $digitalisation->format_id,
                'format_nom' => $digitalisation->format?->nom,
                'traite' => (bool) $digitalisation->traite,
            ])
            ->values();
    }

    public function home()
    {
        $metadata = $this->metadataCollections();

        return Inertia::render('Degitalisation/HomeDigitalisation', [
            'metadata' => $metadata['all'],
            'metadataForDigitalisation' => $metadata['available'],
            'modesRealisation' => ModesRealisation::orderBy('nom')->get(['id', 'nom']),
            'formats' => Format::whereIn('nom', self::DIGITALISATION_FORMATS)->orderBy('id')->get(['id', 'nom']),
            'digitalisations' => $this->digitalisationRows(),
        ]);
    }

    public function create()
    {
        $metadata = $this->metadataCollections();

        return Inertia::render('Degitalisation/Digitalisation', [
            'metadata' => $metadata['available'],
            'modesRealisation' => ModesRealisation::orderBy('nom')->get(['id', 'nom']),
            'formats' => Format::whereIn('nom', self::DIGITALISATION_FORMATS)->orderBy('id')->get(['id', 'nom']),
        ]);
    }

    public function index()
    {
        return Digitalisation2d::with(['metadata.coupure.feuille', 'format'])->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => [
                'required',
                'exists:metadata,id',
                'unique:digitalisation_2d,metadata_id',
                Rule::exists('extraction_altimetrique', 'metadata_id')
                    ->where(fn ($query) => $query->where('traite', true)),
            ],
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_realisation_id' => 'nullable|exists:modes_realisation,id',
            'format_id' => [
                'nullable',
                Rule::exists('formats', 'id')
                    ->where(fn ($query) => $query->whereIn('nom', self::DIGITALISATION_FORMATS)),
            ],
        ]);

        $record = DB::transaction(function () use ($validated) {
            return Digitalisation2d::create([
                'id' => $this->nextId(Digitalisation2d::class),
                ...$validated,
                'traite' => true,
            ]);
        });

        if ($request->expectsJson()) {
            return response()->json($record, 201);
        }

        return redirect()
            ->route('digitalisation.home')
            ->with('success', 'Digitalisation créée avec succès.');
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
            'format_id' => [
                'nullable',
                Rule::exists('formats', 'id')
                    ->where(fn ($query) => $query->whereIn('nom', self::DIGITALISATION_FORMATS)),
            ],
        ]);

        $record->update($validated);

        if ($request->expectsJson()) {
            return response()->json($record);
        }

        return redirect()
            ->route('digitalisation.home')
            ->with('success', 'Digitalisation modifiée avec succès.');
    }

    public function destroy($id)
    {
        return Digitalisation2d::destroy($id);
    }
}
