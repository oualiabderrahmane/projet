<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ModeRealisation;

class ModeRealisationSeeder extends Seeder
{
    public function run(): void
    {
        $modes = [
            'Digitalisation (2D)',
            'Digitalisation assistée',
            'Extraction automatique',
            'Classification orientée objet',
            'Vectorisation automatique',
            'Restitution photogrammétrique (3D)',
        ];

        $nextId = ((int) ModeRealisation::max('id')) + 1;

        foreach ($modes as $mode) {
            $existing = ModeRealisation::where('nom', $mode)->first();

            if (!$existing) {
                $record = new ModeRealisation();
                $record->id = $nextId++;
                $record->nom = $mode;
                $record->save();
            }
        }
    }
}
