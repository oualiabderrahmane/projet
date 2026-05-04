<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NiveauxControle;

class NiveauControleSeeder extends Seeder
{
    public function run(): void
    {
        $niveaux = [
            'Géométrique',
            'Sémantique',
            'Toponymique',
            'Sémiologique',
            'Esthétique',
            'Complétude',
            'Cohérence',
            'Conformité',
        ];

        foreach ($niveaux as $niveau) {
            NiveauxControle::firstOrCreate([
                'nom' => $niveau
            ]);
        }
    }
}
