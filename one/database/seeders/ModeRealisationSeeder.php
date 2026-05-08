<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ModeRealisationSeeder extends Seeder
{
    public function run(): void
    {
        $singularModes = [
            1 => 'Integration des donnees',
            2 => 'Traitement des donnees',
            3 => 'Integration et traitement',
        ];

        foreach ($singularModes as $id => $nom) {
            DB::table('mode_realisation')->updateOrInsert(
                ['id' => $id],
                ['nom' => $nom]
            );
        }

    }
}
