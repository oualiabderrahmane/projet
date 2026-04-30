<?php

namespace App\Http\Controllers;

use App\Models\CoupureFiche;
use Carbon\Carbon;

class FinalleController extends Controller
{
    private function appendCharacterString(\DOMDocument $dom, \DOMElement $parent, string $qualifiedName, ?string $value): \DOMElement
    {
        $element = $dom->createElementNS('http://www.isotc211.org/2005/gmd', $qualifiedName);
        $charString = $dom->createElementNS('http://www.isotc211.org/2005/gco', 'gco:CharacterString');
        $charString->appendChild($dom->createTextNode((string) ($value ?? '')));
        $element->appendChild($charString);
        $parent->appendChild($element);

        return $element;
    }

    private function appendDate(\DOMDocument $dom, \DOMElement $parent, string $qualifiedName, string $date): \DOMElement
    {
        $element = $dom->createElementNS('http://www.isotc211.org/2005/gmd', $qualifiedName);
        $dateElement = $dom->createElementNS('http://www.isotc211.org/2005/gco', 'gco:Date');
        $dateElement->appendChild($dom->createTextNode($date));
        $element->appendChild($dateElement);
        $parent->appendChild($element);

        return $element;
    }

    public function exportXml($id)
    {
        $coupure = CoupureFiche::with([
            'coupure.feuille',
            'metadata.coupure.feuille',
            'metadata.echelle',
            'metadata.pay',
            'metadata.systemes_reference',
            'collecte_preparation',
            'extraction_altimetrique',
            'digitalisation2d',
            'completement_spatial',
            'traitement_vecteur',
            'redaction_cartographique',
            'controle_cartographique',
            'validation_export',
        ])->findOrFail($id);

        $metadata = $coupure->metadata;
        $feuilleNom = $metadata?->coupure?->feuille?->nom ?? $coupure->feuille?->nom ?? 'Sans feuille';
        $coupureNom = $metadata?->coupure?->nom ?? $coupure->coupure?->nom ?? 'Sans coupure';
        $identifier = 'CNEST-CF-' . $coupure->id;
        $today = Carbon::now()->toDateString();
        $creationDate = $metadata?->date_creation_metadata?->toDateString() ?? $today;
        $distributionUrl = $coupure->validation_export?->emplacement;
        $systemRef = $metadata?->systemes_reference;

        $dom = new \DOMDocument('1.0', 'UTF-8');
        $dom->formatOutput = true;

        $root = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:MD_Metadata');
        $root->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:gco', 'http://www.isotc211.org/2005/gco');
        $root->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:gml', 'http://www.opengis.net/gml');
        $dom->appendChild($root);

        $this->appendCharacterString($dom, $root, 'gmd:fileIdentifier', $identifier);
        $this->appendCharacterString($dom, $root, 'gmd:language', 'fre');
        $this->appendCharacterString($dom, $root, 'gmd:characterSet', 'utf8');
        $this->appendCharacterString($dom, $root, 'gmd:hierarchyLevel', 'dataset');
        $this->appendDate($dom, $root, 'gmd:dateStamp', $today);
        $this->appendCharacterString($dom, $root, 'gmd:metadataStandardName', 'ISO 19115');
        $this->appendCharacterString($dom, $root, 'gmd:metadataStandardVersion', 'ISO 19115:2003/Cor.1:2006');

        // Bloc metier demande: contenir explicitement "coupure-fiche"
        $coupureFicheNode = $dom->createElement('coupure-fiche');
        $coupureFicheNode->appendChild($dom->createElement('id', (string) $coupure->id));
        $coupureFicheNode->appendChild($dom->createElement('coupure_id', (string) ($coupure->coupure_id ?? '')));
        $coupureFicheNode->appendChild($dom->createElement('feuille_id', (string) ($coupure->feuille_id ?? '')));
        $coupureFicheNode->appendChild($dom->createElement('metadata_id', (string) ($coupure->metadata_id ?? '')));
        $root->appendChild($coupureFicheNode);

        $identificationInfo = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:identificationInfo');
        $dataIdentification = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:MD_DataIdentification');
        $identificationInfo->appendChild($dataIdentification);
        $root->appendChild($identificationInfo);

        $citation = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:citation');
        $ciCitation = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:CI_Citation');
        $citation->appendChild($ciCitation);
        $dataIdentification->appendChild($citation);

        $title = sprintf('Metadata coupure %s - feuille %s', $coupureNom, $feuilleNom);
        $this->appendCharacterString($dom, $ciCitation, 'gmd:title', $title);

        $date = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:date');
        $ciDate = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:CI_Date');
        $this->appendDate($dom, $ciDate, 'gmd:date', $creationDate);
        $this->appendCharacterString($dom, $ciDate, 'gmd:dateType', 'creation');
        $date->appendChild($ciDate);
        $ciCitation->appendChild($date);

        $abstract = sprintf(
            'Jeu de donnees cartographiques pour la coupure %s (%s), statut de fiche: %s.',
            $coupureNom,
            $feuilleNom,
            $coupure->statut ?? 'non precise'
        );
        $this->appendCharacterString($dom, $dataIdentification, 'gmd:abstract', $abstract);
        $this->appendCharacterString($dom, $dataIdentification, 'gmd:language', 'fre');

        $extent = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:extent');
        $exExtent = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:EX_Extent');
        $geographicElement = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:geographicElement');
        $geoDescription = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:EX_GeographicDescription');
        $geoId = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:geographicIdentifier');
        $mdIdentifier = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:MD_Identifier');
        $this->appendCharacterString($dom, $mdIdentifier, 'gmd:code', $coupureNom);
        $geoId->appendChild($mdIdentifier);
        $geoDescription->appendChild($geoId);
        $geographicElement->appendChild($geoDescription);
        $exExtent->appendChild($geographicElement);
        $extent->appendChild($exExtent);
        $dataIdentification->appendChild($extent);

        $referenceSystemInfo = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:referenceSystemInfo');
        $mdReferenceSystem = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:MD_ReferenceSystem');
        $referenceSystemIdentifier = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:referenceSystemIdentifier');
        $rsIdentifier = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:RS_Identifier');
        $this->appendCharacterString($dom, $rsIdentifier, 'gmd:code', $systemRef?->nom ?? 'Non renseigne');
        $this->appendCharacterString($dom, $rsIdentifier, 'gmd:codeSpace', 'CNEST');
        $referenceSystemIdentifier->appendChild($rsIdentifier);
        $mdReferenceSystem->appendChild($referenceSystemIdentifier);
        $referenceSystemInfo->appendChild($mdReferenceSystem);
        $root->appendChild($referenceSystemInfo);

        if ($distributionUrl) {
            $distributionInfo = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:distributionInfo');
            $mdDistribution = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:MD_Distribution');
            $transferOptions = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:transferOptions');
            $digitalTransferOptions = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:MD_DigitalTransferOptions');
            $onLine = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:onLine');
            $ciOnlineResource = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:CI_OnlineResource');
            $linkage = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:linkage');
            $url = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:URL');
            $url->appendChild($dom->createTextNode($distributionUrl));
            $linkage->appendChild($url);
            $ciOnlineResource->appendChild($linkage);
            $this->appendCharacterString($dom, $ciOnlineResource, 'gmd:name', 'Export XML');
            $onLine->appendChild($ciOnlineResource);
            $digitalTransferOptions->appendChild($onLine);
            $transferOptions->appendChild($digitalTransferOptions);
            $mdDistribution->appendChild($transferOptions);
            $distributionInfo->appendChild($mdDistribution);
            $root->appendChild($distributionInfo);
        }

        $dataQualityInfo = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:dataQualityInfo');
        $dqDataQuality = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:DQ_DataQuality');
        $scope = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:scope');
        $dqScope = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:DQ_Scope');
        $this->appendCharacterString($dom, $dqScope, 'gmd:level', 'dataset');
        $scope->appendChild($dqScope);
        $dqDataQuality->appendChild($scope);

        $lineage = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:lineage');
        $liLineage = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:LI_Lineage');
        $statement = sprintf(
            'Production CNEST: collecte=%s, extraction=%s, digitalisation=%s, completement=%s, traitement=%s, redaction=%s, controle=%s.',
            $coupure->collecte_preparation ? 'oui' : 'non',
            $coupure->extraction_altimetrique ? 'oui' : 'non',
            $coupure->digitalisation2d ? 'oui' : 'non',
            $coupure->completement_spatial ? 'oui' : 'non',
            $coupure->traitement_vecteur ? 'oui' : 'non',
            $coupure->redaction_cartographique ? 'oui' : 'non',
            $coupure->controle_cartographique ? 'oui' : 'non'
        );
        $this->appendCharacterString($dom, $liLineage, 'gmd:statement', $statement);
        $lineage->appendChild($liLineage);
        $dqDataQuality->appendChild($lineage);
        $dataQualityInfo->appendChild($dqDataQuality);
        $root->appendChild($dataQualityInfo);

        $fileName = 'iso19115_coupure_fiche_' . $coupure->id . '.xml';

        return response($dom->saveXML(), 200)
            ->header('Content-Type', 'application/xml')
            ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');
    }
}
