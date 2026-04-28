<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Digitalisation2D;

class Digitalisation2DController extends Controller
{
    public function index()
    {
        return Digitalisation2D::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'metadata_id' => 'required|integer|unique:digitalisation_2d,metadata_id',
            'logiciel_utilise' => 'nullable|string|max:100',
            'version_logiciel' => 'nullable|string|max:50',
            'mode_realisation_id' => 'nullable|integer',
        ]);

        return Digitalisation2D::create($validated);
    }

    public function show($id)
    {
        return Digitalisation2D::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $record = Digitalisation2D::findOrFail($id);
        $record->update($request->all());

        return $record;
    }

    public function destroy($id)
    {
        return Digitalisation2D::destroy($id);
    }
}
