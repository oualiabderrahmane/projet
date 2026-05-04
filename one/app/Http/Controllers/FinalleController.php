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

    private function pdfLabel(string $value): string
    {
        return html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    private function pdfNumber(float $value): string
    {
        $number = rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.');

        return $number === '' ? '0' : $number;
    }

    private function pdfDate(mixed $value): string
    {
        if ($value instanceof Carbon) {
            return $value->format('Y-m-d');
        }

        return trim((string) ($value ?? ''));
    }

    private function pdfValue(mixed $value, int $limit = 48): string
    {
        $text = trim(preg_replace('/\s+/', ' ', (string) ($value ?? '')));

        if ($text === '') {
            return '';
        }

        if (function_exists('mb_strlen') && function_exists('mb_substr')) {
            return mb_strlen($text) > $limit
                ? mb_substr($text, 0, max(0, $limit - 3)).'...'
                : $text;
        }

        return strlen($text) > $limit ? substr($text, 0, max(0, $limit - 3)).'...' : $text;
    }

    private function pdfString(string $value): string
    {
        $value = str_replace(["\r", "\n"], ' ', $value);
        $encoded = function_exists('iconv')
            ? @iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $value)
            : $value;

        if ($encoded === false) {
            $encoded = $value;
        }

        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $encoded);
    }

    private function addPdfText(
        array &$commands,
        float $x,
        float $y,
        string $text,
        string $font = 'F1',
        int $size = 11
    ): void {
        $commands[] = sprintf(
            'BT /%s %d Tf 1 0 0 1 %s %s Tm (%s) Tj ET',
            $font,
            $size,
            $this->pdfNumber($x),
            $this->pdfNumber($y),
            $this->pdfString($text)
        );
    }

    private function addCenteredPdfText(
        array &$commands,
        string $text,
        float $y,
        string $font = 'F1',
        int $size = 11
    ): void {
        $length = function_exists('mb_strlen') ? mb_strlen($text) : strlen($text);
        $x = max(40, (595.28 - ($length * $size * 0.48)) / 2);

        $this->addPdfText($commands, $x, $y, $text, $font, $size);
    }

    private function addPdfLine(array &$commands, float $x1, float $y1, float $x2, float $y2): void
    {
        $commands[] = sprintf(
            '%s %s m %s %s l S',
            $this->pdfNumber($x1),
            $this->pdfNumber($y1),
            $this->pdfNumber($x2),
            $this->pdfNumber($y2)
        );
    }

    private function addPdfField(
        array &$commands,
        string $label,
        mixed $value,
        float $labelX,
        float $valueX,
        float $y,
        float $endX,
        int $limit = 48
    ): void {
        $this->addPdfText($commands, $labelX, $y, $label, 'F2', 11);
        $this->addPdfText($commands, $valueX, $y, $this->pdfValue($value, $limit), 'F1', 11);
        $this->addPdfLine($commands, $valueX, $y - 3, $endX, $y - 3);
    }

    private function wrapPdfStream(string $stream): string
    {
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
            '<< /Length '.strlen($stream)." >>\nstream\n".$stream.'endstream',
        ];

        $pdf = "%PDF-1.4\n%".chr(226).chr(227).chr(207).chr(211)."\n";
        $offsets = [0];

        foreach ($objects as $index => $object) {
            $objectNumber = $index + 1;
            $offsets[$objectNumber] = strlen($pdf);
            $pdf .= $objectNumber." 0 obj\n".$object."\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n";
        $pdf .= "0000000000 65535 f \n";

        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }

        $pdf .= "trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\n";
        $pdf .= "startxref\n".$xrefOffset."\n%%EOF";

        return $pdf;
    }

    private function buildMetadataPdf(CoupureFiche $coupure): string
    {
        $metadata = $coupure->metadata;
        $feuilleNom = $metadata?->coupure?->feuille?->nom ?? $coupure->feuille?->nom;
        $coupureNom = $metadata?->coupure?->nom ?? $coupure->coupure?->nom;
        $coupureLabel = $metadata?->coupure?->label ?? $coupureNom;
        $creationDate = $this->pdfDate($metadata?->date_creation_metadata) ?: Carbon::now()->toDateString();
        $formatNames = array_values(array_unique(array_filter([
            $coupure->digitalisation2d?->format?->nom,
            $coupure->traitement_vecteur?->format?->nom,
            $coupure->redaction_cartographique?->format?->nom,
        ])));
        $controles = $metadata?->controle_cartographiques?->sortBy('id')->values() ?? collect();

        if ($controles->isEmpty() && $coupure->controle_cartographique) {
            $controles = collect([$coupure->controle_cartographique]);
        }

        $commands = ['0.8 w'];

        $this->addPdfLine($commands, 45, 50, 550, 50);
        $this->addPdfLine($commands, 550, 50, 550, 815);
        $this->addPdfLine($commands, 550, 815, 45, 815);
        $this->addPdfLine($commands, 45, 815, 45, 50);

        $this->addCenteredPdfText($commands, $this->pdfLabel('Fiche de M&eacute;tadonn&eacute;es'), 785, 'F2', 16);

        $this->addPdfField($commands, 'Feuille :', $feuilleNom, 70, 130, 740, 300, 28);
        $this->addPdfField($commands, 'Coupure :', $coupureNom, 345, 420, 740, 525, 20);
        $this->addPdfField($commands, 'Nom de la Coupure :', $coupureLabel, 70, 205, 710, 525, 42);
        $this->addPdfField($commands, 'Pays :', $metadata?->pay?->nom, 70, 130, 680, 525, 55);
        $this->addPdfField($commands, 'Echelle :', $metadata?->echelle?->valeur, 70, 130, 650, 525, 55);
        $this->addPdfField($commands, $this->pdfLabel('Syst&egrave;me de r&eacute;f&eacute;rence :'), $metadata?->systemes_reference?->nom, 70, 215, 620, 525, 42);
        $this->addPdfField($commands, $this->pdfLabel('Relev&eacute; g&eacute;n&eacute;alogique :'), $metadata?->types_releve?->nom, 70, 215, 590, 525, 42);
        $this->addPdfField($commands, 'Imagerie :', $coupure->collecte_preparation?->imagerie, 70, 140, 560, 300, 24);
        $this->addPdfField($commands, $this->pdfLabel('R&eacute;solution :'), $coupure->collecte_preparation?->resolution, 345, 430, 560, 525, 18);
        $this->addPdfField($commands, $this->pdfLabel('Donn&eacute;es 3D :'), $coupure->extraction_altimetrique?->mnt, 70, 155, 530, 300, 22);
        $this->addPdfField($commands, $this->pdfLabel('R&eacute;solution :'), $coupure->extraction_altimetrique?->resolution, 345, 430, 530, 525, 18);
        $this->addPdfField($commands, "Mode d'extraction :", $coupure->extraction_altimetrique?->modes_extraction?->nom, 70, 190, 500, 525, 45);
        $this->addPdfField($commands, $this->pdfLabel('Mode de r&eacute;alisation :'), $coupure->digitalisation2d?->modes_realisation?->nom, 70, 205, 470, 525, 42);
        $this->addPdfField($commands, 'Mode de traitement :', $coupure->traitement_vecteur?->mode_realisation?->nom, 70, 205, 440, 525, 42);
        $this->addPdfField($commands, 'Formats :', implode(', ', $formatNames), 70, 135, 410, 525, 55);

        foreach ([350, 275, 200] as $index => $headingY) {
            $controle = $controles->get($index);
            $fieldY = $headingY - 28;
            $controleDate = $this->pdfDate($controle?->date_controle)
                ?: $this->pdfDate($controle?->date_fin)
                ?: $this->pdfDate($controle?->date_edition);

            $this->addCenteredPdfText($commands, 'Controle Externe', $headingY, 'F2', 12);
            $this->addPdfField($commands, 'Niveau :', $controle?->niveaux_controle?->nom, 125, 185, $fieldY, 305, 22);
            $this->addPdfField($commands, 'Date :', $controleDate, 345, 390, $fieldY, 500, 18);
        }

        $this->addPdfField($commands, $this->pdfLabel('Date de cr&eacute;ation :'), $creationDate, 185, 295, 125, 430, 24);

        return $this->wrapPdfStream(implode("\n", $commands)."\n");
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
        $identifier = 'CNEST-CF-'.$coupure->id;
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

        $fileName = 'iso19115_coupure_fiche_'.$coupure->id.'.xml';

        return response($dom->saveXML(), 200)
            ->header('Content-Type', 'application/xml')
            ->header('Content-Disposition', 'attachment; filename="'.$fileName.'"');
    }

    public function exportPdf($id)
    {
        $coupure = CoupureFiche::with([
            'coupure.feuille',
            'feuille',
            'metadata.coupure.feuille',
            'metadata.echelle',
            'metadata.pay',
            'metadata.systemes_reference',
            'metadata.types_releve',
            'metadata.controle_cartographiques.niveaux_controle',
            'collecte_preparation',
            'extraction_altimetrique.modes_extraction',
            'digitalisation2d.modes_realisation',
            'digitalisation2d.format',
            'traitement_vecteur.mode_realisation',
            'traitement_vecteur.format',
            'redaction_cartographique.format',
            'controle_cartographique.niveaux_controle',
            'validation_export',
        ])->findOrFail($id);

        $pdf = $this->buildMetadataPdf($coupure);
        $fileName = 'fiche_metadata_'.$coupure->id.'.pdf';

        return response($pdf, 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="'.$fileName.'"');
    }
}
