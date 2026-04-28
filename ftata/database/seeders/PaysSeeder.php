<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pay;

class PaysSeeder extends Seeder
{
    public function run(): void
    {
        $pays = [
            'Algérie',
            'Maroc',
            'RASD',
            'Mauritanie',
            'Mali',
            'Niger',
            'Libye',
            'Tunisie',
        ];

        foreach ($pays as $nom) {
            Pay::firstOrCreate([
                'nom' => $nom
            ]);
        }
    }
}
