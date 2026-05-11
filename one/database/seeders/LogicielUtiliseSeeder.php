<?php

namespace Database\Seeders;

use App\Models\LogicielUtilise;
use Illuminate\Database\Seeder;

class LogicielUtiliseSeeder extends Seeder
{
    public function run(): void
    {
        $logiciels = [
            'ArcGIS Desktop',
            'ArcGIS Pro',
            'ERDAS IMAGINE',
            'QGIS',
            'Global Mapper',
        ];

        foreach ($logiciels as $logiciel) {
            LogicielUtilise::firstOrCreate([
                'nom' => $logiciel,
            ]);
        }
    }
}
