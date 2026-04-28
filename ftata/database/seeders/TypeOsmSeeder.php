<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TypesOsm;

class TypeOsmSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            'DGN',
            'SHP',
            'MDB',
            'GDB',
        ];

        foreach ($types as $type) {
            TypesOsm::firstOrCreate([
                'nom' => $type
            ]);
        }
    }
}
