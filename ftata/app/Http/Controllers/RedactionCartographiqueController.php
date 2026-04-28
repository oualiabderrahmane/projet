<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RedactionCartographique;

class RedactionCartographiqueController extends Controller
{
    public function index()
    {
        return RedactionCartographique::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => 'required|integer|unique:redaction_cartographique,metadata_id',
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
        ]);

        return RedactionCartographique::create($validated);
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
        ]);

        $record->update($validated);

        return $record;
    }

    public function destroy($id)
    {
        return RedactionCartographique::destroy($id);
    }
}
