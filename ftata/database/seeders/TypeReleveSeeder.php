<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TypesReleve;

class TypeReleveSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            'Nouvelle édition',
            'Révision',
            'Réédition',
            'Perfection',
            'Autre',
        ];

        foreach ($types as $type) {
            TypesReleve::firstOrCreate([
                'nom' => $type
            ]);
        }
    }
}
