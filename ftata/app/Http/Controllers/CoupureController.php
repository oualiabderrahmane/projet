<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Coupure;
use App\Models\Feuille;

class CoupureController extends Controller
{
    // GET /coupures
    public function index()
    {
        return response()->json(Coupure::with('feuille')->get());
    }

    // POST /coupures
    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100',
            'feuille_id' => 'required|exists:feuilles,id'
        ]);

        $coupure = Coupure::create([
            'nom' => $request->nom,
            'feuille_id' => $request->feuille_id
        ]);

        return response()->json($coupure, 201);
    }

    // GET /coupures/{id}
    public function show($id)
    {
        $coupure = Coupure::with('feuille')->find($id);

        if (!$coupure) {
            return response()->json(['message' => 'Coupure not found'], 404);
        }

        return response()->json($coupure);
    }

    // PUT /coupures/{id}
    public function update(Request $request, $id)
    {
        $coupure = Coupure::find($id);

        if (!$coupure) {
            return response()->json(['message' => 'Coupure not found'], 404);
        }

        $request->validate([
            'nom' => 'required|string|max:100',
            'feuille_id' => 'required|exists:feuilles,id'
        ]);

        $coupure->update([
            'nom' => $request->nom,
            'feuille_id' => $request->feuille_id
        ]);

        return response()->json($coupure);
    }

    // DELETE /coupures/{id}
    public function destroy($id)
    {
        $coupure = Coupure::find($id);

        if (!$coupure) {
            return response()->json(['message' => 'Coupure not found'], 404);
        }

        $coupure->delete();

        return response()->json(['message' => 'Coupure deleted']);
    }
    public function getByFeuille($feuille_id)
{
    $feuille =Feuille::with('coupures')->find($feuille_id);

    if (!$feuille) {
        return response()->json(['message' => 'Feuille not found'], 404);
    }

    return response()->json($feuille->coupures);
}
}
