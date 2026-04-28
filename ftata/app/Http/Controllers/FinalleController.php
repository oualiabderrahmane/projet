<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CoupureFiche;
class FinalleController extends Controller
{


public function exportXml($id)
{
    $coupure = CoupureFiche::with([
        'collectePreparation',
        'extractionAltimetrique',
        'digitalisation2d',
        'completementSpatial',
        'traitementVecteur',
        'redactionCartographique',
        'controleCartographique',
    ])->findOrFail($id);

    $xml = new \SimpleXMLElement('<coupure_fiche/>');

    $xml->addChild('coupure_id', $coupure->coupure_id);
    $xml->addChild('feuille_id', $coupure->feuille_id);
    $xml->addChild('metadata_id', $coupure->metadata_id);
    $xml->addChild('statut', $coupure->statut);

    // helper function
    $addSection = function ($xmlParent, $name, $data) {
        if (!$data) return;

        $node = $xmlParent->addChild($name);

        foreach ($data->toArray() as $key => $value) {
            $node->addChild($key, htmlspecialchars((string)$value));
        }
    };

    $addSection($xml, 'collecte_preparation', $coupure->collectePreparation);
    $addSection($xml, 'extraction_altimetrique', $coupure->extractionAltimetrique);
    $addSection($xml, 'digitalisation_2d', $coupure->digitalisation2d);
    $addSection($xml, 'completement_spatial', $coupure->completementSpatial);
    $addSection($xml, 'traitement_vecteur', $coupure->traitementVecteur);
    $addSection($xml, 'redaction_cartographique', $coupure->redactionCartographique);
    $addSection($xml, 'controle_cartographique', $coupure->controleCartographique);

    return response($xml->asXML(), 200)
        ->header('Content-Type', 'application/xml');
}
}
