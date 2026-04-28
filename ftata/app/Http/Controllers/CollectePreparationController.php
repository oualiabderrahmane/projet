<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CollectePreparation;

class CollectePreparationController extends Controller
{
    // GET all
    public function index()
    {
        return response()->json(
            CollectePreparation::with('metadata')->get()
        );
    }

    // CREATE
    public function store(Request $request)
    {
        $request->validate([
            'metadata_id' => 'required|exists:metadata,id|unique:collecte_preparation,metadata_id',
            'imagerie' => 'nullable|string|max:150',
            'resolution' => 'nullable|string|max:100',
            'type_osm_id' => 'nullable|integer',
            'geonames_annee_mise_a_jour' => 'nullable|integer',
            'gadm_version' => 'nullable|string|max:50',
        ]);

        $cp = CollectePreparation::create($request->all());

        return response()->json($cp, 201);
    }

    // SHOW
    public function show($id)
    {
        $cp = CollectePreparation::with('metadata')->find($id);

        if (!$cp) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($cp);
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        $cp = CollectePreparation::find($id);

        if (!$cp) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $request->validate([
            'imagerie' => 'nullable|string|max:150',
            'resolution' => 'nullable|string|max:100',
            'type_osm_id' => 'nullable|integer',
            'geonames_annee_mise_a_jour' => 'nullable|integer',
            'gadm_version' => 'nullable|string|max:50',
        ]);

        $cp->update($request->all());

        return response()->json($cp);
    }

    // DELETE
    public function destroy($id)
    {
        $cp = CollectePreparation::find($id);

        if (!$cp) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $cp->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
