<?php

namespace Database\Seeders;

use App\Models\Format;
use Illuminate\Database\Seeder;

class FormatSeeder extends Seeder
{
    public function run(): void
    {
        $formats = [
            'Dxf',
            'Dgm',
            'Shp',
            'GDB',
            'MDB',
            'GeoTif',
            'pdf',
            'ecw',
            'autre',
        ];

        foreach ($formats as $format) {
            Format::firstOrCreate([
                'nom' => $format,
            ]);
        }
    }
}
