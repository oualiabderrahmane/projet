<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ModesRealisationSeeder extends Seeder
{
    public function run(): void
    {
        $modes = [
            1 => 'Digitalisation (2D)',
            2 => 'Digitalisation assistée',
            3 => 'Extraction automatique',
            4 => 'classification orientée objet',
            5 => 'Vectorisation automatique',
            6 => 'Restitution photogrammetrique (3D)',
        ];

        DB::transaction(function () use ($modes) {
            DB::table('digitalisation_2d')
                ->whereNotNull('mode_realisation_id')
                ->update(['mode_realisation_id' => null]);

            DB::table('modes_realisation')->delete();

            DB::table('modes_realisation')->insert(
                collect($modes)
                    ->map(fn (string $nom, int $id) => [
                        'id' => $id,
                        'nom' => $nom,
                    ])
                    ->values()
                    ->all()
            );
        });
    }
}
