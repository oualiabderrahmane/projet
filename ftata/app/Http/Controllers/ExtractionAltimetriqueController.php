<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ExtractionAltimetrique;

class ExtractionAltimetriqueController extends Controller
{
    public function index()
    {
        return ExtractionAltimetrique::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => 'required|integer|unique:extraction_altimetrique,metadata_id',
            'mnt' => 'nullable|string|max:150',
            'resolution' => 'nullable|string|max:100',
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_extraction_id' => 'nullable|integer',
        ]);

        return ExtractionAltimetrique::create($validated);
    }

    public function show($id)
    {
        return ExtractionAltimetrique::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $record = ExtractionAltimetrique::findOrFail($id);

        $record->update($request->all());

        return $record;
    }

    public function destroy($id)
    {
        return ExtractionAltimetrique::destroy($id);
    }
}
