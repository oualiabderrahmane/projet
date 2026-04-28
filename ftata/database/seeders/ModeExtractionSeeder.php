<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ModesExtraction;

class ModeExtractionSeeder extends Seeder
{
    public function run(): void
    {
        $modes = [
            'Isolignes',
            'Classification altimétrique',
            'Extraction conditionnelle',
            'Segmentation orientée objet',
            'Analyse morphométrique',
        ];

        foreach ($modes as $mode) {
            ModesExtraction::firstOrCreate([
                'nom' => $mode
            ]);
        }
    }
}
