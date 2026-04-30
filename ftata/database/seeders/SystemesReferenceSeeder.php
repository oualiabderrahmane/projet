<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemesReference;

class SystemesReferenceSeeder extends Seeder
{
    public function run(): void
    {
        // GCS (Geographic Coordinate System)
        SystemesReference::create([
            'nom' => 'WGS 1984',
            'type' => 'GCS',
            'zone' => null,
        ]);

        // UTM Zones 28 to 35
        for ($zone = 28; $zone <= 35; $zone++) {
            SystemesReference::create([
                'nom' => 'WGS 1984',
                'type' => 'UTM',
                'zone' => $zone,
            ]);
        }
    }
}
