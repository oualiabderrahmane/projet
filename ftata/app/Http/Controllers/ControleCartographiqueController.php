<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ControleCartographique;

class ControleCartographiqueController extends Controller
{
    public function index()
    {
        return ControleCartographique::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => 'required|integer|unique:controle_cartographique,metadata_id',
            'type_controle_id' => 'nullable|integer',
            'niveau_controle_id' => 'nullable|integer',
            'date_controle' => 'nullable|date',
            'date_edition' => 'nullable|date',
        ]);

        return ControleCartographique::create($validated);
    }

    public function show($id)
    {
        return ControleCartographique::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $record = ControleCartographique::findOrFail($id);

        $validated = $request->validate([
            'type_controle_id' => 'nullable|integer',
            'niveau_controle_id' => 'nullable|integer',
            'date_controle' => 'nullable|date',
            'date_edition' => 'nullable|date',
        ]);

        $record->update($validated);

        return $record;
    }

    public function destroy($id)
    {
        return ControleCartographique::destroy($id);
    }
}
