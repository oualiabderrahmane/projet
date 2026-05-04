<?php

namespace Database\Seeders;

use App\Models\Operateur;
use Illuminate\Database\Seeder;

class OperateurSeeder extends Seeder
{
    public function run(): void
    {
        $operateurs = [
            ['nom' => 'Operateur Collecte', 'grade' => 'Technicien', 'fonction' => 'Collecte et preparation', 'type' => 'collect'],
            ['nom' => 'Operateur Extraction', 'grade' => 'Ingenieur', 'fonction' => 'Extraction altimetrique', 'type' => 'extraction'],
            ['nom' => 'Operateur Digitalisation', 'grade' => 'Technicien superieur', 'fonction' => 'Digitalisation 2D', 'type' => 'digitalisation'],
            ['nom' => 'Operateur Completement', 'grade' => 'Technicien', 'fonction' => 'Completement spatial', 'type' => 'completment_spatial'],
            ['nom' => 'Operateur Traitement', 'grade' => 'Ingenieur', 'fonction' => 'Traitement vecteur', 'type' => 'traitment_vecteur'],
            ['nom' => 'Operateur Redaction', 'grade' => 'Cartographe', 'fonction' => 'Redaction cartographique', 'type' => 'redaction'],
            ['nom' => 'Operateur Controle', 'grade' => 'Controleur', 'fonction' => 'Controle cartographique', 'type' => 'controle'],
            ['nom' => 'Operateur Validation', 'grade' => 'Responsable', 'fonction' => 'Validation export', 'type' => 'validation'],
        ];

        foreach ($operateurs as $operateur) {
            Operateur::updateOrCreate(
                [
                    'nom' => $operateur['nom'],
                    'type' => $operateur['type'],
                ],
                $operateur
            );
        }
    }
}
