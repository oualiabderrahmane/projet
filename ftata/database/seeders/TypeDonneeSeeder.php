<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TypesDonneesSpatiale;

class TypeDonneeSeeder extends Seeder
{
    public function run(): void
    {
        // Anciennes cartes par échelle (each one as a record)
        $echelles = [
            'Ancienne carte 50k',
            'Ancienne carte 100k',
            'Ancienne carte 125k',
            'Ancienne carte 150k',
            'Ancienne carte 200k',
            'Ancienne carte 250k',
            'Ancienne carte 500k',
            'Ancienne carte 1M',
        ];

        foreach ($echelles as $type) {
           TypesDonneesSpatiale::firstOrCreate([
                'nom' => $type
            ]);
        }

        // Other data sources
        $others = [
            'Données GEONAMES',
            'GADM',
            'OSM',
            'Image satellitaire',
            'Autres',
        ];

        foreach ($others as $type) {
            TypesDonneesSpatiale::firstOrCreate([
                'nom' => $type
            ]);
        }
    }
}
