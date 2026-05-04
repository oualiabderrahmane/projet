<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesPhaseFields;
use App\Models\CollectePreparation;
use App\Models\CompletementSpatial;
use App\Models\ControleCartographique;
use App\Models\CoupureFiche;
use App\Models\Digitalisation2d;
use App\Models\ExtractionAltimetrique;
use App\Models\Metadata;
use App\Models\RedactionCartographique;
use App\Models\TraitementVecteur;
use App\Models\ValidationExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ValidationExportController extends Controller
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

    private function metadataRows()
    {
        return Metadata::with(['coupure.feuille', 'echelle'])
            ->whereHas('redaction_cartographiques', fn ($query) => $query->where('traite', true))
            ->whereHas('controle_cartographiques')
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
    }

    private function ficheRows()
    {
        return Metadata::with([
            'coupure.feuille',
            'validation_exports',
            'validation_exports.operateur',
            'coupure_fiches.validation_export.operateur',
        ])
            ->whereHas('redaction_cartographiques', fn ($query) => $query->where('traite', true))
            ->whereHas('controle_cartographiques')
            ->orderBy('id')
            ->get()
            ->map(function (Metadata $metadata) {
                $fiche = $metadata->coupure_fiches->first();
                $validationExport = $metadata->validation_exports->first() ?: $fiche?->validation_export;

                return [
                    'metadata_id' => $metadata->id,
                    'fiche_id' => $fiche?->id,
                    'feuille_nom' => $metadata->coupure?->feuille?->nom,
                    'coupure_nom' => $metadata->coupure?->nom,
                    'coupure_label' => $metadata->coupure?->label,
                    'operateur_id' => $validationExport?->operateur_id,
                    'operateur_nom' => $validationExport?->operateur?->nom,
                    'emplacement' => $validationExport?->emplacement,
                ];
            })
            ->values();
    }

    public function create()
    {
        return Inertia::render('Redaction/Validation', [
            'metadata' => $this->metadataRows(),
            'fiches' => $this->ficheRows(),
            'operateurs' => $this->operateurRows('validation'),
        ]);
    }

    private function validateExportRequest(Request $request): array
    {
        return $request->validate([
            'feuille_id' => 'required|exists:feuilles,id',
            'coupure_id' => 'required|exists:coupures,id',
            'metadata_id' => [
                'required',
                'exists:metadata,id',
                Rule::exists('redaction_cartographique', 'metadata_id')
                    ->where(fn ($query) => $query->where('traite', true)),
                Rule::exists('controle_cartographique', 'metadata_id'),
            ],
            ...$this->phaseFieldRules('validation'),
            'emplacement' => 'nullable|string|max:255',
        ]);
    }

    private function saveFiche(array $validated, string $format): CoupureFiche
    {
        return DB::transaction(function () use ($validated, $format) {
            $metadata = Metadata::with('coupure.feuille')->findOrFail($validated['metadata_id']);

            if (
                (string) $metadata->coupure_id !== (string) $validated['coupure_id'] ||
                (string) $metadata->coupure?->feuille?->id !== (string) $validated['feuille_id']
            ) {
                abort(422, 'La feuille et la coupure selectionnees ne correspondent pas.');
            }

            $validationExport = ValidationExport::where('metadata_id', $metadata->id)->first();

            if (! $validationExport) {
                $validationExport = new ValidationExport([
                    'metadata_id' => $metadata->id,
                    'operateur_id' => $validated['operateur_id'] ?? null,
                    'emplacement' => $validated['emplacement'] ?? null,
                    'format' => $format,
                ]);
                $validationExport->id = $this->nextId(ValidationExport::class);
                $validationExport->save();
            } else {
                $validationExport->update([
                    'operateur_id' => $validated['operateur_id'] ?? null,
                    'emplacement' => $validated['emplacement'] ?? null,
                    'format' => $format,
                ]);
            }

            $fiche = CoupureFiche::where('coupure_id', $metadata->coupure_id)->first() ?: new CoupureFiche;

            $fiche->fill([
                'coupure_id' => $metadata->coupure_id,
                'feuille_id' => $metadata->coupure?->feuille?->id,
                'metadata_id' => $metadata->id,
                'collecte_preparation_id' => CollectePreparation::where('metadata_id', $metadata->id)->value('id'),
                'extraction_altimetrique_id' => ExtractionAltimetrique::where('metadata_id', $metadata->id)->value('id'),
                'digitalisation_2d_id' => Digitalisation2d::where('metadata_id', $metadata->id)->value('id'),
                'completement_spatial_id' => CompletementSpatial::where('metadata_id', $metadata->id)->value('id'),
                'traitement_vecteur_id' => TraitementVecteur::where('metadata_id', $metadata->id)->value('id'),
                'redaction_cartographique_id' => RedactionCartographique::where('metadata_id', $metadata->id)->value('id'),
                'controle_cartographique_id' => ControleCartographique::where('metadata_id', $metadata->id)->value('id'),
                'validation_export_id' => $validationExport->id,
                'etape_courante' => 8,
            ]);
            $fiche->save();

            return $fiche;
        });
    }

    public function download(Request $request)
    {
        $fiche = $this->saveFiche($this->validateExportRequest($request), 'xml');

        return redirect()->route('coupure-fiche.xml', $fiche);
    }

    public function downloadPdf(Request $request)
    {
        $fiche = $this->saveFiche($this->validateExportRequest($request), 'pdf');

        return redirect()->route('coupure-fiche.pdf', $fiche);
    }
}
