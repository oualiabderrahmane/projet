<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Feuille;

class FeuilleController extends Controller
{
    // GET /feuilles
    public function index()
    {
        return response()->json(Feuille::all());
    }

    // POST /feuilles
    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100'
        ]);

        $feuille = Feuille::create([
            'nom' => $request->nom
        ]);

        return response()->json($feuille, 201);
    }


    
    public function show($id)
    {
        $feuille = Feuille::find($id);

        if (!$feuille) {
            return response()->json(['message' => 'Feuille not found'], 404);
        }

        return response()->json($feuille);
    }

    // PUT /feuilles/{id}
    public function update(Request $request, $id)
    {
        $feuille = Feuille::find($id);

        if (!$feuille) {
            return response()->json(['message' => 'Feuille not found'], 404);
        }

        $request->validate([
            'nom' => 'required|string|max:100'
        ]);

        $feuille->update([
            'nom' => $request->nom
        ]);

        return response()->json($feuille);
    }


    public function destroy($id)
    {
        $feuille = Feuille::find($id);

        if (!$feuille) {
            return response()->json(['message' => 'Feuille not found'], 404);
        }

        $feuille->delete();

        return response()->json(['message' => 'Feuille deleted']);
    }
}
