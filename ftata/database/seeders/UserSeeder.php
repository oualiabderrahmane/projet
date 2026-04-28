<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Get roles
        $admin = Role::where('name', 'admin')->first();
        $collect = Role::where('name', 'collect')->first();
        $extraction = Role::where('name', 'extraction')->first();
        $digitalisation = Role::where('name', 'digitalisation')->first();
        $spatial = Role::where('name', 'completment_spatial')->first();
        $vector = Role::where('name', 'traitment_vecteur')->first();
        $redaction = Role::where('name', 'redaction')->first();

        // 1. Admin user
        $adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);
        $adminUser->roles()->attach($admin->id);

        // 2. Collect user
        $collectUser = User::create([
            'name' => 'Collect User',
            'email' => 'collect@example.com',
            'password' => Hash::make('password'),
        ]);
        $collectUser->roles()->attach($collect->id);

        // 3. Extraction user
        $extractionUser = User::create([
            'name' => 'Extraction User',
            'email' => 'extraction@example.com',
            'password' => Hash::make('password'),
        ]);
        $extractionUser->roles()->attach($extraction->id);

        // 4. Digitalisation user
        $digitalUser = User::create([
            'name' => 'Digitalisation User',
            'email' => 'digital@example.com',
            'password' => Hash::make('password'),
        ]);
        $digitalUser->roles()->attach($digitalisation->id);

        // 5. Spatial completion user
        $spatialUser = User::create([
            'name' => 'Spatial User',
            'email' => 'spatial@example.com',
            'password' => Hash::make('password'),
        ]);
        $spatialUser->roles()->attach($spatial->id);

        // 6. Vector processing user
        $vectorUser = User::create([
            'name' => 'Vector User',
            'email' => 'vector@example.com',
            'password' => Hash::make('password'),
        ]);
        $vectorUser->roles()->attach($vector->id);

        // 7. Redaction user
        $redactionUser = User::create([
            'name' => 'Redaction User',
            'email' => 'redaction@example.com',
            'password' => Hash::make('password'),
        ]);
        $redactionUser->roles()->attach($redaction->id);
    }
}
