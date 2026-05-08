<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            'Admin',
            'Chef',
            'Collect',
            'Extraction',
            'Digitalisation',
            'Complément spatial',
            'Traitement vecteur',
            'Rédaction',
        ] as $role) {
            Role::firstOrCreate(['name' => $role]);
        }
    }
}
