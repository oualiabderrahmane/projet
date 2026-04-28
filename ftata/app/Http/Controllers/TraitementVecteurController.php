<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TraitementVecteur;

class TraitementVecteurController extends Controller
{
    public function index()
    {
        return TraitementVecteur::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => 'required|integer|unique:traitement_vecteur,metadata_id',
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_realisation_id' => 'nullable|integer',
            'tolerance_topologique' => 'nullable|string|max:100',
        ]);

        return TraitementVecteur::create($validated);
    }

    public function show($id)
    {
        return TraitementVecteur::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $record = TraitementVecteur::findOrFail($id);

        $validated = $request->validate([
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_realisation_id' => 'nullable|integer',
            'tolerance_topologique' => 'nullable|string|max:100',
        ]);

        $record->update($validated);

        return $record;
    }

    public function destroy($id)
    {
        return TraitementVecteur::destroy($id);
    }
}
