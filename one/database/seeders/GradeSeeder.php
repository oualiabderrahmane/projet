<?php

namespace Database\Seeders;

use App\Models\Grade;
use Illuminate\Database\Seeder;

class GradeSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            'Colonel',
            'Lieutenant-colonel',
            'Commandant',
            'Capitaine',
            'Lieutenant',
            'Sous-lieutenant',
            'Adjudant-chef',
            'Adjudant',
            'Sergent-chef',
            'Sergent',
            'PCA',
        ] as $nom) {
            Grade::updateOrCreate(['nom' => $nom]);
        }
    }
}
