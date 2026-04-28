<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TypesControle;

class TypeControleSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            'Contrôle interne',
            'Contrôle externe',
            'Flashage et impression',
        ];

        foreach ($types as $type) {
            TypesControle::firstOrCreate([
                'nom' => $type
            ]);
        }
    }
}
