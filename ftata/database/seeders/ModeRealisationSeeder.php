<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ModesRealisation;

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

        foreach ($modes as $mode) {
            ModesRealisation::firstOrCreate([
                'nom' => $mode
            ]);
        }
    }
}
