<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemesReference;

class SystemesReferenceSeeder extends Seeder
{
    public function run(): void
    {
        SystemesReference::firstOrCreate([
            'nom' => 'WGS 1984',
            'type' => 'GCS',
            'zone' => null,
        ]);

        for ($zone = 28; $zone <= 35; $zone++) {
            SystemesReference::firstOrCreate([
                'nom' => 'WGS 1984',
                'type' => 'UTM',
                'zone' => $zone,
            ]);
        }
    }
}
