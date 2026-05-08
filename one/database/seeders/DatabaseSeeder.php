<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            GradeSeeder::class,
            PosteSeeder::class,
            UserSeeder::class,

            EchelleSeeder::class,
            PaysSeeder::class,
            SystemesReferenceSeeder::class,
            TypeOsmSeeder::class,
            TypeReleveSeeder::class,
            TypeControleSeeder::class,
            TypeDonneeSeeder::class,
            NiveauControleSeeder::class,
            ModeExtractionSeeder::class,
            ModeRealisationSeeder::class,
            ModesRealisationSeeder::class,
            LogicielUtiliseSeeder::class,
            FormatSeeder::class,

            
        ]);
    }
}
