<?php

namespace Database\Seeders;

use App\Models\Poste;
use Illuminate\Database\Seeder;

class PosteSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            'Chef de division',
            'Chef département',
            'Chef de service',
            'Chef section',
            'Chef sous-section',
            'Opérateur',
        ] as $nom) {
            Poste::updateOrCreate(['nom' => $nom]);
        }
    }
}
