<?php

namespace Database\Seeders;

use App\Models\Format;
use Illuminate\Database\Seeder;

class FormatSeeder extends Seeder
{
    public function run(): void
    {
        $renames = [
            'Dxf' => 'DXF',
            'Dgm' => 'DGN',
            'Shp' => 'SHP',
            'GeoTif' => 'Geotif',
        ];

        foreach ($renames as $oldName => $newName) {
            Format::where('nom', $oldName)->update(['nom' => $newName]);
        }

        $formats = [
            'DXF',
            'DGN',
            'SHP',
            'GDB',
            'MDB',
            'Geotif',
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
