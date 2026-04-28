<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Echelle;

class EchelleSeeder extends Seeder
{
    public function run(): void
    {
        $echelles = [
            '1/25 000',
            '1/50 000',
            '1/100 000',
            '1/200 000',
            '1/500 000',
            '1/1 000 000',
        ];

        foreach ($echelles as $value) {
            Echelle::firstOrCreate([
                'valeur' => $value
            ]);
        }
    }
}
