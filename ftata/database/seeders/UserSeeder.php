<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    private function ensureUser(string $name, string $email, string $roleName): void
    {
        $role = Role::firstOrCreate(['name' => $roleName]);

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make('password'),
            ]
        );

        $user->roles()->syncWithoutDetaching([$role->id]);
    }

    public function run(): void
    {
        $this->ensureUser('Admin User', 'admin@example.com', 'admin');
        $this->ensureUser('Collect User', 'collect@example.com', 'collect');
        $this->ensureUser('Extraction User', 'extraction@example.com', 'extraction');
        $this->ensureUser('Digitalisation User', 'digital@example.com', 'digitalisation');
        $this->ensureUser('Spatial User', 'spatial@example.com', 'completment_spatial');
        $this->ensureUser('Vector User', 'vector@example.com', 'traitment_vecteur');
        $this->ensureUser('Redaction User', 'redaction@example.com', 'redaction');
        $this->ensureUser('Chef User', 'chef@example.com', 'chef');
    }
}
