<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CompletementSpatial;

class CompletementSpatialController extends Controller
{
    public function index()
    {
        return CompletementSpatial::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => 'required|integer|unique:completement_spatial,metadata_id',
            'type_donnees_id' => 'nullable|integer',
        ]);

        return CompletementSpatial::create($validated);
    }

    public function show($id)
    {
        return CompletementSpatial::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $record = CompletementSpatial::findOrFail($id);

        $validated = $request->validate([
            'type_donnees_id' => 'nullable|integer',
        ]);

        $record->update($validated);

        return $record;
    }

    public function destroy($id)
    {
        return CompletementSpatial::destroy($id);
    }
}
