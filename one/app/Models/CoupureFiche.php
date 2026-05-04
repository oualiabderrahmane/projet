<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class CoupureFiche
 * 
 * @property int $id
 * @property int $coupure_id
 * @property int $feuille_id
 * @property int|null $metadata_id
 * @property int|null $collecte_preparation_id
 * @property int|null $extraction_altimetrique_id
 * @property int|null $digitalisation_2d_id
 * @property int|null $completement_spatial_id
 * @property int|null $traitement_vecteur_id
 * @property int|null $redaction_cartographique_id
 * @property int|null $controle_cartographique_id
 * @property int|null $validation_export_id
 * @property int|null $etape_courante
 * @property string|null $statut
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property Coupure $coupure
 * @property Feuille $feuille
 * @property Metadata|null $metadata
 * @property CollectePreparation|null $collecte_preparation
 * @property ExtractionAltimetrique|null $extraction_altimetrique
 * @property Digitalisation2d|null $digitalisation2d
 * @property CompletementSpatial|null $completement_spatial
 * @property TraitementVecteur|null $traitement_vecteur
 * @property RedactionCartographique|null $redaction_cartographique
 * @property ControleCartographique|null $controle_cartographique
 * @property ValidationExport|null $validation_export
 *
 * @package App\Models
 */
class CoupureFiche extends Model
{
	protected $table = 'coupure_fiche';

	protected $casts = [
		'coupure_id' => 'int',
		'feuille_id' => 'int',
		'metadata_id' => 'int',
		'collecte_preparation_id' => 'int',
		'extraction_altimetrique_id' => 'int',
		'digitalisation_2d_id' => 'int',
		'completement_spatial_id' => 'int',
		'traitement_vecteur_id' => 'int',
		'redaction_cartographique_id' => 'int',
		'controle_cartographique_id' => 'int',
		'validation_export_id' => 'int',
		'etape_courante' => 'int'
	];

	protected $fillable = [
		'coupure_id',
		'feuille_id',
		'metadata_id',
		'collecte_preparation_id',
		'extraction_altimetrique_id',
		'digitalisation_2d_id',
		'completement_spatial_id',
		'traitement_vecteur_id',
		'redaction_cartographique_id',
		'controle_cartographique_id',
		'validation_export_id',
		'etape_courante',
		'statut'
	];

	public function coupure()
	{
		return $this->belongsTo(Coupure::class);
	}

	public function feuille()
	{
		return $this->belongsTo(Feuille::class);
	}

	public function metadata()
	{
		return $this->belongsTo(Metadata::class);
	}

	public function collecte_preparation()
	{
		return $this->belongsTo(CollectePreparation::class);
	}

	public function extraction_altimetrique()
	{
		return $this->belongsTo(ExtractionAltimetrique::class);
	}

	public function digitalisation2d()
	{
		return $this->belongsTo(Digitalisation2d::class);
	}

	public function completement_spatial()
	{
		return $this->belongsTo(CompletementSpatial::class);
	}

	public function traitement_vecteur()
	{
		return $this->belongsTo(TraitementVecteur::class);
	}

	public function redaction_cartographique()
	{
		return $this->belongsTo(RedactionCartographique::class);
	}

	public function controle_cartographique()
	{
		return $this->belongsTo(ControleCartographique::class);
	}

	public function validation_export()
	{
		return $this->belongsTo(ValidationExport::class);
	}
}
