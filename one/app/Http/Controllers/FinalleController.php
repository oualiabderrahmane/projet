<?php

namespace App\Http\Controllers;

use App\Models\CoupureFiche;
use Carbon\Carbon;

class FinalleController extends Controller
{
    private bool $osmTileFetchDisabled = false;

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

    private function pdfFileCode(mixed $value, mixed $fallback): string
    {
        $value = trim((string) ($value ?? ''));

        if (preg_match('/\d+/', $value, $matches)) {
            return $matches[0];
        }

        $value = preg_replace('/[^A-Za-z0-9]+/', '', $value) ?: '';

        if ($value !== '') {
            return $value;
        }

        return preg_replace('/[^A-Za-z0-9]+/', '', (string) ($fallback ?? '0')) ?: '0';
    }

    private function pdfExportFileName(CoupureFiche $coupure): string
    {
        $feuille = $coupure->metadata?->coupure?->feuille ?? $coupure->feuille;
        $coupureRow = $coupure->metadata?->coupure ?? $coupure->coupure;

        return sprintf(
            'F%sC%s.pdf',
            $this->pdfFileCode($feuille?->nom, $feuille?->id ?? $coupure->feuille_id),
            $this->pdfFileCode($coupureRow?->nom, $coupureRow?->id ?? $coupure->coupure_id)
        );
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
    }

    private function wrapPdfStream(string $stream): string
    {
        return $this->wrapPdfPages([$stream]);
    }

    private function wrapPdfPages(array $streams, array $images = []): string
    {
        $streams = array_values($streams);
        $objects = [];
        $fontRegularObject = 3;
        $fontBoldObject = 4;
        $nextObject = 5;
        $imageObjects = [];

        foreach ($images as $name => $image) {
            $imageObjects[$name] = $nextObject++;
        }

        $usesTransparency = collect($streams)->contains(fn (string $stream) => str_contains($stream, '/GS1 gs'));
        $extGStateObject = null;

        if ($usesTransparency) {
            $extGStateObject = $nextObject++;
        }

        $pageObjects = [];
        $contentObjects = [];

        foreach ($streams as $index => $stream) {
            $pageObjects[$index] = $nextObject++;
            $contentObjects[$index] = $nextObject++;
        }

        $xObjectResources = '';

        if ($imageObjects) {
            $references = collect($imageObjects)
                ->map(fn (int $object, string $name) => '/'.$name.' '.$object.' 0 R')
                ->implode(' ');
            $xObjectResources = ' /XObject << '.$references.' >>';
        }

        $extGStateResources = $extGStateObject ? ' /ExtGState << /GS1 '.$extGStateObject.' 0 R >>' : '';
        $resources = '<< /Font << /F1 '.$fontRegularObject.' 0 R /F2 '.$fontBoldObject.' 0 R >>'.$xObjectResources.$extGStateResources.' >>';

        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[2] = '<< /Type /Pages /Kids ['.collect($pageObjects)->map(fn (int $object) => $object.' 0 R')->implode(' ').'] /Count '.count($streams).' >>';
        $objects[$fontRegularObject] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objects[$fontBoldObject] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

        foreach ($imageObjects as $name => $object) {
            $image = $images[$name];
            $objects[$object] = '<< /Type /XObject /Subtype /Image /Width '.$image['width'].' /Height '.$image['height'].' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length '.strlen($image['data'])." >>\nstream\n".$image['data']."\nendstream";
        }

        if ($extGStateObject) {
            $objects[$extGStateObject] = '<< /Type /ExtGState /ca 0.35 /CA 1 /BM /Normal >>';
        }

        foreach ($streams as $index => $stream) {
            $objects[$pageObjects[$index]] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources '.$resources.' /Contents '.$contentObjects[$index].' 0 R >>';
            $objects[$contentObjects[$index]] = '<< /Length '.strlen($stream)." >>\nstream\n".$stream.'endstream';
        }

        ksort($objects);

        $pdf = "%PDF-1.4\n%".chr(226).chr(227).chr(207).chr(211)."\n";
        $offsets = [0];

        foreach ($objects as $objectNumber => $object) {
            $offsets[$objectNumber] = strlen($pdf);
            $pdf .= $objectNumber." 0 obj\n".$object."\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $maxObject = max(array_keys($objects));
        $pdf .= "xref\n0 ".($maxObject + 1)."\n";
        $pdf .= "0000000000 65535 f \n";

        for ($i = 1; $i <= $maxObject; $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i] ?? 0);
        }

        $pdf .= "trailer\n<< /Size ".($maxObject + 1)." /Root 1 0 R >>\n";
        $pdf .= "startxref\n".$xrefOffset."\n%%EOF";

        return $pdf;
    }

    private function parseCoordinate(?string $value, string $axis): ?float
    {
        $value = trim((string) ($value ?? ''));

        if ($value === '') {
            return null;
        }

        $normalized = str_replace(',', '.', $value);
        $upper = strtoupper($normalized);
        preg_match_all('/-?\d+(?:\.\d+)?/', $normalized, $matches);

        if (empty($matches[0])) {
            return null;
        }

        $first = (float) $matches[0][0];
        $coordinate = abs($first);

        if (isset($matches[0][1])) {
            $coordinate += ((float) $matches[0][1]) / 60;
        }

        if (isset($matches[0][2])) {
            $coordinate += ((float) $matches[0][2]) / 3600;
        }

        $sign = $first < 0 ? -1 : 1;
        $hasWest = str_contains($upper, 'OUEST')
            || str_contains($upper, 'WEST')
            || preg_match('/(^|[^A-Z])(W|O)([^A-Z]|$)/', $upper);
        $hasSouth = str_contains($upper, 'SUD')
            || str_contains($upper, 'SOUTH')
            || preg_match('/(^|[^A-Z])S([^A-Z]|$)/', $upper);
        $hasEast = str_contains($upper, 'EST')
            || str_contains($upper, 'EAST')
            || preg_match('/(^|[^A-Z])E([^A-Z]|$)/', $upper);
        $hasNorth = str_contains($upper, 'NORD')
            || str_contains($upper, 'NORTH')
            || preg_match('/(^|[^A-Z])N([^A-Z]|$)/', $upper);

        if ($hasWest || $hasSouth) {
            $sign = -1;
        } elseif ($hasNorth || $hasEast) {
            $sign = 1;
        }

        $coordinate *= $sign;

        if ($axis === 'lat' && abs($coordinate) > 90) {
            return null;
        }

        if ($axis === 'lon' && abs($coordinate) > 180) {
            return null;
        }

        return $coordinate;
    }

    private function coupureBounds(CoupureFiche $coupure): ?array
    {
        $source = $coupure->metadata?->coupure ?? $coupure->coupure;

        if (!$source) {
            return null;
        }

        $north = $this->parseCoordinate($source->latitude_nord, 'lat');
        $south = $this->parseCoordinate($source->latitude_sud, 'lat');
        $west  = $this->parseCoordinate($source->longitude_ouest, 'lon');
        $east  = $this->parseCoordinate($source->longitude_est, 'lon');

        if ($north === null || $south === null || $west === null || $east === null) {
            return null;
        }

        $latMin = min($north, $south);
        $latMax = max($north, $south);
        $lonMin = min($west, $east);
        $lonMax = max($west, $east);

        if ($latMin === $latMax || $lonMin === $lonMax) {
            return null;
        }

        return [
            'north'     => $latMax,
            'south'     => $latMin,
            'west'      => $lonMin,
            'east'      => $lonMax,
            'centerLat' => ($latMin + $latMax) / 2,
            'centerLon' => ($lonMin + $lonMax) / 2,
        ];
    }

    private function mercatorPixel(float $lat, float $lon, int $zoom): array
    {
        $lat    = max(-85.05112878, min(85.05112878, $lat));
        $scale  = 256 * (2 ** $zoom);
        $sinLat = sin(deg2rad($lat));

        return [
            'x' => (($lon + 180) / 360) * $scale,
            'y' => (0.5 - log((1 + $sinLat) / (1 - $sinLat)) / (4 * pi())) * $scale,
        ];
    }

    /**
     * Calcule le niveau de zoom OSM optimal pour afficher la coupure avec du contexte.
     *
     * CORRECTIF : le zoom max est plafonné à 11 (vue régionale, jamais rue) et la
     * marge de contexte autour de la coupure est augmentée à 280 px sur chaque axe,
     * ce qui oblige l'algorithme à choisir un zoom plus dézoomé et montre bien
     * l'environnement géographique autour de la coupure.
     */
    private function zoomForBounds(array $bounds, int $width, int $height): int
    {
        // Plafond à 11 : au-delà (12-19) on voit trop peu de contexte.
        $maxZoom = 11;

        // Marge de contexte : la coupure doit tenir dans (width - contextMargin*2).
        // Plus cette valeur est grande, plus le zoom sera faible → plus de contexte visible.
        $contextMargin = 280;

        for ($zoom = $maxZoom; $zoom >= 3; $zoom--) {
            $northWest   = $this->mercatorPixel($bounds['north'], $bounds['west'], $zoom);
            $southEast   = $this->mercatorPixel($bounds['south'], $bounds['east'], $zoom);
            $boundsWidth = abs($southEast['x'] - $northWest['x']);
            $boundsHeight = abs($southEast['y'] - $northWest['y']);

            if ($boundsWidth <= ($width - $contextMargin) && $boundsHeight <= ($height - $contextMargin)) {
                return $zoom;
            }
        }

        return 3;
    }

    private function fetchOsmTile(int $zoom, int $tileX, int $tileY): ?string
    {
        $limit = 2 ** $zoom;

        if ($tileY < 0 || $tileY >= $limit) {
            return null;
        }

        $wrappedX  = (($tileX % $limit) + $limit) % $limit;
        $cachePath = storage_path("app/map-tiles/{$zoom}/{$wrappedX}/{$tileY}.png");

        if (is_file($cachePath)) {
            return file_get_contents($cachePath) ?: null;
        }

        if ($this->osmTileFetchDisabled) {
            return null;
        }

        if (!function_exists('curl_init')) {
            $this->osmTileFetchDisabled = true;

            return null;
        }

        $url    = "https://tile.openstreetmap.org/{$zoom}/{$wrappedX}/{$tileY}.png";
        $handle = curl_init($url);

        if (!$handle) {
            return null;
        }

        curl_setopt_array($handle, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 1,
            CURLOPT_TIMEOUT        => 2,
            CURLOPT_USERAGENT      => 'CNEST metadata PDF map renderer',
        ]);

        $data   = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        curl_close($handle);

        if ($status !== 200 || !is_string($data) || !str_starts_with($data, "\x89PNG")) {
            $this->osmTileFetchDisabled = true;

            return null;
        }

        if (!is_dir(dirname($cachePath))) {
            @mkdir(dirname($cachePath), 0775, true);
        }

        @file_put_contents($cachePath, $data);

        return $data;
    }

    private function paethPredictor(int $left, int $up, int $upperLeft): int
    {
        $p  = $left + $up - $upperLeft;
        $pa = abs($p - $left);
        $pb = abs($p - $up);
        $pc = abs($p - $upperLeft);

        if ($pa <= $pb && $pa <= $pc) {
            return $left;
        }

        return $pb <= $pc ? $up : $upperLeft;
    }

    private function decodePngToRgb(string $png): ?array
    {
        if (!str_starts_with($png, "\x89PNG\r\n\x1A\n")) {
            return null;
        }

        $offset    = 8;
        $width     = null;
        $height    = null;
        $bitDepth  = null;
        $colorType = null;
        $interlace = null;
        $palette   = '';
        $compressed = '';
        $length    = strlen($png);

        while ($offset + 8 <= $length) {
            $chunkLength = unpack('N', substr($png, $offset, 4))[1];
            $type        = substr($png, $offset + 4, 4);
            $data        = substr($png, $offset + 8, $chunkLength);
            $offset     += 12 + $chunkLength;

            if ($type === 'IHDR') {
                $header    = unpack('Nwidth/Nheight/CbitDepth/CcolorType/Ccompression/Cfilter/Cinterlace', $data);
                $width     = $header['width'];
                $height    = $header['height'];
                $bitDepth  = $header['bitDepth'];
                $colorType = $header['colorType'];
                $interlace = $header['interlace'];
            } elseif ($type === 'PLTE') {
                $palette = $data;
            } elseif ($type === 'IDAT') {
                $compressed .= $data;
            } elseif ($type === 'IEND') {
                break;
            }
        }

        if (!$width || !$height || $bitDepth !== 8 || $interlace !== 0 || $compressed === '') {
            return null;
        }

        $components = match ($colorType) {
            0, 3    => 1,
            2       => 3,
            6       => 4,
            default => null,
        };

        if ($components === null || ($colorType === 3 && $palette === '')) {
            return null;
        }

        $raw = @gzuncompress($compressed);

        if ($raw === false) {
            $raw = @zlib_decode($compressed);
        }

        if (!is_string($raw)) {
            return null;
        }

        $rowBytes    = $width * $components;
        $sourceOffset = 0;
        $previous    = str_repeat("\0", $rowBytes);
        $rgbRows     = [];

        for ($y = 0; $y < $height; $y++) {
            if ($sourceOffset >= strlen($raw)) {
                return null;
            }

            $filter      = ord($raw[$sourceOffset]);
            $sourceOffset++;
            $scanline    = substr($raw, $sourceOffset, $rowBytes);
            $sourceOffset += $rowBytes;
            $row         = '';

            for ($i = 0; $i < $rowBytes; $i++) {
                $value      = ord($scanline[$i]);
                $left       = $i >= $components ? ord($row[$i - $components]) : 0;
                $up         = ord($previous[$i]);
                $upperLeft  = $i >= $components ? ord($previous[$i - $components]) : 0;

                $value = match ($filter) {
                    1       => $value + $left,
                    2       => $value + $up,
                    3       => $value + intdiv($left + $up, 2),
                    4       => $value + $this->paethPredictor($left, $up, $upperLeft),
                    default => $value,
                };

                $row .= chr($value & 0xff);
            }

            $previous = $row;

            if ($colorType === 2) {
                $rgbRows[] = $row;
                continue;
            }

            $rgbRow = '';

            for ($x = 0; $x < $width; $x++) {
                $index = $x * $components;

                if ($colorType === 6) {
                    $rgbRow .= $row[$index].$row[$index + 1].$row[$index + 2];
                } elseif ($colorType === 0) {
                    $gray    = $row[$index];
                    $rgbRow .= $gray.$gray.$gray;
                } elseif ($colorType === 3) {
                    $paletteIndex = ord($row[$index]) * 3;
                    $rgbRow      .= substr($palette, $paletteIndex, 3) ?: "\xE8\xF0\xF0";
                }
            }

            $rgbRows[] = $rgbRow;
        }

        return [
            'width'  => $width,
            'height' => $height,
            'rgb'    => implode('', $rgbRows),
        ];
    }

    /**
     * Construit l'image de fond OSM.
     *
     * CORRECTIF : résolution augmentée de 512×640 à 768×960 px.
     * Avec moins de zoom (voir zoomForBounds) la zone couverte est plus grande ;
     * plus de pixels garantit que les tuiles ne seront pas sur-étirées dans le PDF.
     */
    private function buildMapImage(array $bounds, int $width = 768, int $height = 960): array
    {
        $zoom      = $this->zoomForBounds($bounds, $width, $height);
        $center    = $this->mercatorPixel($bounds['centerLat'], $bounds['centerLon'], $zoom);
        $topLeftX  = (int) floor($center['x'] - ($width / 2));
        $topLeftY  = (int) floor($center['y'] - ($height / 2));
        $background = str_repeat("\xD8\xEB\xEF", $width);
        $rows      = array_fill(0, $height, $background);
        $firstTileX = (int) floor($topLeftX / 256);
        $lastTileX  = (int) floor(($topLeftX + $width - 1) / 256);
        $firstTileY = (int) floor($topLeftY / 256);
        $lastTileY  = (int) floor(($topLeftY + $height - 1) / 256);

        for ($tileY = $firstTileY; $tileY <= $lastTileY; $tileY++) {
            for ($tileX = $firstTileX; $tileX <= $lastTileX; $tileX++) {
                $tilePng = $this->fetchOsmTile($zoom, $tileX, $tileY);
                $tile    = $tilePng ? $this->decodePngToRgb($tilePng) : null;

                if (!$tile || $tile['width'] !== 256 || $tile['height'] !== 256) {
                    continue;
                }

                $tileLeft   = ($tileX * 256) - $topLeftX;
                $tileTop    = ($tileY * 256) - $topLeftY;
                $copyLeft   = max(0, $tileLeft);
                $copyTop    = max(0, $tileTop);
                $copyRight  = min($width, $tileLeft + 256);
                $copyBottom = min($height, $tileTop + 256);

                if ($copyLeft >= $copyRight || $copyTop >= $copyBottom) {
                    continue;
                }

                for ($y = $copyTop; $y < $copyBottom; $y++) {
                    $sourceY      = $y - $tileTop;
                    $sourceX      = $copyLeft - $tileLeft;
                    $copyWidth    = $copyRight - $copyLeft;
                    $sourceOffset = (($sourceY * 256) + $sourceX) * 3;
                    $targetOffset = $copyLeft * 3;
                    $segment      = substr($tile['rgb'], $sourceOffset, $copyWidth * 3);
                    $rows[$y]     = substr_replace($rows[$y], $segment, $targetOffset, strlen($segment));
                }
            }
        }

        $northWest  = $this->mercatorPixel($bounds['north'], $bounds['west'], $zoom);
        $southEast  = $this->mercatorPixel($bounds['south'], $bounds['east'], $zoom);
        $left       = max(0, min($width,  $northWest['x'] - $topLeftX));
        $right      = max(0, min($width,  $southEast['x'] - $topLeftX));
        $top        = max(0, min($height, $northWest['y'] - $topLeftY));
        $bottom     = max(0, min($height, $southEast['y'] - $topLeftY));

        return [
            'image' => [
                'width'  => $width,
                'height' => $height,
                'data'   => gzcompress(implode('', $rows), 6),
            ],
            'rectangle' => [
                'left'   => min($left, $right),
                'right'  => max($left, $right),
                'top'    => min($top, $bottom),
                'bottom' => max($top, $bottom),
            ],
        ];
    }

    private function addPdfRect(
        array &$commands,
        float $x,
        float $y,
        float $width,
        float $height,
        string $operator = 'S'
    ): void {
        $commands[] = sprintf(
            '%s %s %s %s re %s',
            $this->pdfNumber($x),
            $this->pdfNumber($y),
            $this->pdfNumber($width),
            $this->pdfNumber($height),
            $operator
        );
    }

    private function addDpgLogo(array &$commands, float $x = 48.0, float $y = 764.0): void
    {
        $commands[] = 'q 0.04 0.28 0.22 rg';
        $this->addPdfRect($commands, $x, $y, 58, 36, 'f');
        $commands[] = '1 1 1 rg';
        $this->addPdfText($commands, $x + 10, $y + 13, 'DPG', 'F2', 16);
        $commands[] = 'Q';
    }

    private function buildMapPdfPage(CoupureFiche $coupure, array &$images): ?string
    {
        $bounds      = $this->coupureBounds($coupure);
        $metadata    = $coupure->metadata;
        $feuilleNom  = $metadata?->coupure?->feuille?->nom ?? $coupure->feuille?->nom;
        $coupureNom  = $metadata?->coupure?->nom ?? $coupure->coupure?->nom;

        if (!$bounds) {
            return null;
        }

        $map             = $this->buildMapImage($bounds);
        $images['ImMap'] = $map['image'];
        $mapX            = 55.0;
        $mapY            = 95.0;
        $mapWidth        = 485.0;
        $mapHeight       = 625.0;
        $rectangle       = $map['rectangle'];

        // Conversion rectangle image → coordonnées PDF
        $rectX      = $mapX + (($rectangle['left']   / $map['image']['width'])  * $mapWidth);
        $rectY      = $mapY + $mapHeight - (($rectangle['bottom'] / $map['image']['height']) * $mapHeight);
        $rectWidth  = max(3.0, (($rectangle['right']  - $rectangle['left'])   / $map['image']['width'])  * $mapWidth);
        $rectHeight = max(3.0, (($rectangle['bottom'] - $rectangle['top'])    / $map['image']['height']) * $mapHeight);

        $commands = ['0.8 w'];

        $this->addDpgLogo($commands);
        $this->addCenteredPdfText($commands, 'Localisation de la coupure', 790, 'F2', 16);
        

        // Image OSM
        $commands[] = sprintf(
            'q %s 0 0 %s %s %s cm /ImMap Do Q',
            $this->pdfNumber($mapWidth),
            $this->pdfNumber($mapHeight),
            $this->pdfNumber($mapX),
            $this->pdfNumber($mapY)
        );

        // Bordure externe de la carte
        $commands[] = 'q 0.1 0.35 0.28 RG 1.2 w';
        $this->addPdfRect($commands, $mapX, $mapY, $mapWidth, $mapHeight);
        $commands[] = 'Q';

        // Rectangle de la coupure (remplissage semi-transparent + contour)
        $commands[] = 'q /GS1 gs 0.12 0.72 0.55 rg';
        $this->addPdfRect($commands, $rectX, $rectY, $rectWidth, $rectHeight, 'f');
        $commands[] = 'Q';
        $commands[] = 'q 0.02 0.38 0.27 RG 4 w';
        $this->addPdfRect($commands, $rectX, $rectY, $rectWidth, $rectHeight);
        $commands[] = 'Q';



        return implode("\n", $commands)."\n";
    }

    private function buildMetadataPdf(CoupureFiche $coupure): string
    {
        $metadata      = $coupure->metadata;
        $feuilleNom    = $metadata?->coupure?->feuille?->nom ?? $coupure->feuille?->nom;
        $coupureNom    = $metadata?->coupure?->nom ?? $coupure->coupure?->nom;
        $coupureLabel  = $metadata?->coupure?->label ?? $coupureNom;
        $creationDate  = $this->pdfDate($metadata?->date_creation_metadata) ?: Carbon::now()->toDateString();
        $formatNames   = array_values(array_unique(array_filter([
            $coupure->digitalisation2d?->format?->nom,
            $coupure->traitement_vecteur?->format?->nom,
            $coupure->redaction_cartographique?->format?->nom,
        ])));
        $controles     = $metadata?->controle_cartographiques?->sortBy('id')->values() ?? collect();

        if ($controles->isEmpty() && $coupure->controle_cartographique) {
            $controles = collect([$coupure->controle_cartographique]);
        }

        $commands = ['0.8 w'];

        $this->addDpgLogo($commands);
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
            $controle      = $controles->get($index);
            $fieldY        = $headingY - 28;
            $controleDate  = $this->pdfDate($controle?->date_controle)
                ?: $this->pdfDate($controle?->date_fin)
                ?: $this->pdfDate($controle?->date_edition);

            $this->addCenteredPdfText($commands, 'Controle Externe', $headingY, 'F2', 12);
            $this->addPdfField($commands, 'Niveau :', $controle?->niveaux_controle?->nom, 125, 185, $fieldY, 305, 22);
            $this->addPdfField($commands, 'Date :', $controleDate, 345, 390, $fieldY, 500, 18);
        }

        $this->addPdfField($commands, $this->pdfLabel('Date de cr&eacute;ation :'), $creationDate, 185, 295, 125, 430, 24);

        $images  = [];
        $pages   = [implode("\n", $commands)."\n"];
        $mapPage = $this->buildMapPdfPage($coupure, $images);

        if ($mapPage) {
            $pages[] = $mapPage;
        }

        return $this->wrapPdfPages($pages, $images);
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

        $metadata       = $coupure->metadata;
        $feuilleNom     = $metadata?->coupure?->feuille?->nom ?? $coupure->feuille?->nom ?? 'Sans feuille';
        $coupureNom     = $metadata?->coupure?->nom ?? $coupure->coupure?->nom ?? 'Sans coupure';
        $identifier     = 'CNEST-CF-'.$coupure->id;
        $today          = Carbon::now()->toDateString();
        $creationDate   = $metadata?->date_creation_metadata?->toDateString() ?? $today;
        $distributionUrl = $coupure->validation_export?->emplacement;
        $systemRef      = $metadata?->systemes_reference;

        $dom  = new \DOMDocument('1.0', 'UTF-8');
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

        $coupureFicheNode = $dom->createElement('coupure-fiche');
        $coupureFicheNode->appendChild($dom->createElement('id', (string) $coupure->id));
        $coupureFicheNode->appendChild($dom->createElement('coupure_id', (string) ($coupure->coupure_id ?? '')));
        $coupureFicheNode->appendChild($dom->createElement('feuille_id', (string) ($coupure->feuille_id ?? '')));
        $coupureFicheNode->appendChild($dom->createElement('metadata_id', (string) ($coupure->metadata_id ?? '')));
        $root->appendChild($coupureFicheNode);

        $identificationInfo  = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:identificationInfo');
        $dataIdentification  = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:MD_DataIdentification');
        $identificationInfo->appendChild($dataIdentification);
        $root->appendChild($identificationInfo);

        $citation   = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:citation');
        $ciCitation = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:CI_Citation');
        $citation->appendChild($ciCitation);
        $dataIdentification->appendChild($citation);

        $title = sprintf('Metadata coupure %s - feuille %s', $coupureNom, $feuilleNom);
        $this->appendCharacterString($dom, $ciCitation, 'gmd:title', $title);

        $date   = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:date');
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

        $extent              = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:extent');
        $exExtent            = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:EX_Extent');
        $geographicElement   = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:geographicElement');
        $geoDescription      = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:EX_GeographicDescription');
        $geoId               = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:geographicIdentifier');
        $mdIdentifier        = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:MD_Identifier');
        $this->appendCharacterString($dom, $mdIdentifier, 'gmd:code', $coupureNom);
        $geoId->appendChild($mdIdentifier);
        $geoDescription->appendChild($geoId);
        $geographicElement->appendChild($geoDescription);
        $exExtent->appendChild($geographicElement);
        $extent->appendChild($exExtent);
        $dataIdentification->appendChild($extent);

        $referenceSystemInfo       = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:referenceSystemInfo');
        $mdReferenceSystem         = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:MD_ReferenceSystem');
        $referenceSystemIdentifier = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:referenceSystemIdentifier');
        $rsIdentifier              = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:RS_Identifier');
        $this->appendCharacterString($dom, $rsIdentifier, 'gmd:code', $systemRef?->nom ?? 'Non renseigne');
        $this->appendCharacterString($dom, $rsIdentifier, 'gmd:codeSpace', 'CNEST');
        $referenceSystemIdentifier->appendChild($rsIdentifier);
        $mdReferenceSystem->appendChild($referenceSystemIdentifier);
        $referenceSystemInfo->appendChild($mdReferenceSystem);
        $root->appendChild($referenceSystemInfo);

        if ($distributionUrl) {
            $distributionInfo        = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:distributionInfo');
            $mdDistribution          = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:MD_Distribution');
            $transferOptions         = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:transferOptions');
            $digitalTransferOptions  = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:MD_DigitalTransferOptions');
            $onLine                  = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:onLine');
            $ciOnlineResource        = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:CI_OnlineResource');
            $linkage                 = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:linkage');
            $url                     = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:URL');
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
        $dqDataQuality   = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:DQ_DataQuality');
        $scope           = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:scope');
        $dqScope         = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:DQ_Scope');
        $this->appendCharacterString($dom, $dqScope, 'gmd:level', 'dataset');
        $scope->appendChild($dqScope);
        $dqDataQuality->appendChild($scope);

        $lineage   = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:lineage');
        $liLineage = $dom->createElementNS('http://www.isotc211.org/2005/gmd', 'gmd:LI_Lineage');
        $statement = sprintf(
            'Production CNEST: collecte=%s, extraction=%s, digitalisation=%s, completement=%s, traitement=%s, redaction=%s, controle=%s.',
            $coupure->collecte_preparation       ? 'oui' : 'non',
            $coupure->extraction_altimetrique     ? 'oui' : 'non',
            $coupure->digitalisation2d            ? 'oui' : 'non',
            $coupure->completement_spatial        ? 'oui' : 'non',
            $coupure->traitement_vecteur          ? 'oui' : 'non',
            $coupure->redaction_cartographique    ? 'oui' : 'non',
            $coupure->controle_cartographique     ? 'oui' : 'non'
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

        $pdf      = $this->buildMetadataPdf($coupure);
        $fileName = $this->pdfExportFileName($coupure);

        return response($pdf, 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="'.$fileName.'"');
    }
}
