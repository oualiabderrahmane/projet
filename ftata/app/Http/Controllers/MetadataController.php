<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Feuille;
use App\Models\Coupure;
use App\Models\Metadata;

class MetadataController extends Controller
{
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
    $request->validate([
        'feuille_nom' => 'required|string|max:100',
        'coupure_nom' => 'required|string|max:100',
        'date_creation_metadata' => 'required|date'
    ]);

    return DB::transaction(function () use ($request) {

        // 1. Check or create Feuille
        $feuille = Feuille::where('nom', $request->feuille_nom)->first();

        if (!$feuille) {
            $feuille = Feuille::create([
                'nom' => $request->feuille_nom
            ]);
        }

        // 2. Check or create Coupure under this Feuille
        $coupure = Coupure::where('nom', $request->coupure_nom)
            ->where('feuille_id', $feuille->id)
            ->first();

        if (!$coupure) {
            $coupure = Coupure::create([
                'nom' => $request->coupure_nom,
                'feuille_id' => $feuille->id
            ]);
        }

        // 3. Create Metadata (no need to check usually)
        $metadata = Metadata::create([
            'coupure_id' => $coupure->id,
            'pays_id' => $request->pays_id,
            'systeme_reference_id' => $request->systeme_reference_id,
            'type_releve_id' => $request->type_releve_id,
            'echelle_id' => $request->echelle_id,
            'date_creation_metadata' => $request->date_creation_metadata
        ]);

        return response()->json($metadata, 201);
    });
}
}
