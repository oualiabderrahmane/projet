<?php

namespace Database\Seeders;

use App\Models\Grade;
use App\Models\Poste;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    private function ensureUser(
        string $nom,
        string $prenom,
        string $email,
        string $roleName,
        string $gradeName,
        string $posteName
    ): void {
        $role = Role::where('name', $roleName)->firstOrFail();

        $grade = Grade::firstOrCreate([
            'nom' => $gradeName,
        ]);

        $poste = Poste::firstOrCreate([
            'nom' => $posteName,
        ]);

        User::updateOrCreate(
            ['email' => $email],
            [
                'nom' => $nom,
                'prenom' => $prenom,
                'password' => Hash::make('password'),
                'role_id' => $role->id,
                'grade_id' => $grade->id,
                'poste_id' => $poste->id,
            ]
        );
    }

    public function run(): void
    {
        $this->ensureUser(
            'Admin',
            'User',
            'admin@example.com',
            'Admin',
            'Colonel',
            'Chef de division'
        );

        $this->ensureUser(
            'Chef',
            'User',
            'chef@example.com',
            'Chef',
            'Commandant',
            'Chef département'
        );

        $this->ensureUser(
            'Collect',
            'User',
            'collect@example.com',
            'Collect',
            'Capitaine',
            'Opérateur'
        );

        $this->ensureUser(
            'Extraction',
            'User',
            'extraction@example.com',
            'Extraction',
            'Lieutenant',
            'Opérateur'
        );

        $this->ensureUser(
            'Digitalisation',
            'User',
            'digital@example.com',
            'Digitalisation',
            'Sous-lieutenant',
            'Opérateur'
        );

        $this->ensureUser(
            'Spatial',
            'User',
            'spatial@example.com',
            'Complément spatial',
            'Adjudant',
            'Opérateur'
        );

        $this->ensureUser(
            'Vector',
            'User',
            'vector@example.com',
            'Traitement vecteur',
            'Sergent-chef',
            'Opérateur'
        );

        $this->ensureUser(
            'Redaction',
            'User',
            'redaction@example.com',
            'Rédaction',
            'Sergent',
            'Opérateur'
        );
    }
}
