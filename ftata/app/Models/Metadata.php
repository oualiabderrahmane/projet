<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Metadata
 * 
 * @property int $id
 * @property int $coupure_id
 * @property int|null $pays_id
 * @property int|null $systeme_reference_id
 * @property int|null $type_releve_id
 * @property int|null $echelle_id
 * @property Carbon|null $date_creation_metadata
 * 
 * @property Coupure $coupure
 * @property Pay|null $pay
 * @property SystemesReference|null $systemes_reference
 * @property TypesReleve|null $types_releve
 * @property Echelle|null $echelle
 * @property Collection|CollectePreparation[] $collecte_preparations
 * @property Collection|ExtractionAltimetrique[] $extraction_altimetriques
 * @property Collection|Digitalisation2d[] $digitalisation2ds
 * @property Collection|CompletementSpatial[] $completement_spatials
 * @property Collection|TraitementVecteur[] $traitement_vecteurs
 * @property Collection|RedactionCartographique[] $redaction_cartographiques
 * @property Collection|ControleCartographique[] $controle_cartographiques
 * @property Collection|ValidationExport[] $validation_exports
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class Metadata extends Model
{
	protected $table = 'metadata';
	public $timestamps = false;
	public $incrementing = false;
	protected $keyType = 'int';

	protected $casts = [
		'coupure_id' => 'int',
		'pays_id' => 'int',
		'systeme_reference_id' => 'int',
		'type_releve_id' => 'int',
		'echelle_id' => 'int',
		'date_creation_metadata' => 'datetime'
	];

	protected $fillable = [
		'id',
		'coupure_id',
		'pays_id',
		'systeme_reference_id',
		'type_releve_id',
		'echelle_id',
		'date_creation_metadata'
	];

	public function coupure()
	{
		return $this->belongsTo(Coupure::class);
	}

	public function pay()
	{
		return $this->belongsTo(Pay::class, 'pays_id');
	}

	public function systemes_reference()
	{
		return $this->belongsTo(SystemesReference::class, 'systeme_reference_id');
	}

	public function types_releve()
	{
		return $this->belongsTo(TypesReleve::class, 'type_releve_id');
	}

	public function echelle()
	{
		return $this->belongsTo(Echelle::class);
	}

	public function collecte_preparations()
	{
		return $this->hasMany(CollectePreparation::class);
	}

	public function extraction_altimetriques()
	{
		return $this->hasMany(ExtractionAltimetrique::class);
	}

	public function digitalisation2ds()
	{
		return $this->hasMany(Digitalisation2d::class);
	}

	public function completement_spatials()
	{
		return $this->hasMany(CompletementSpatial::class);
	}

	public function traitement_vecteurs()
	{
		return $this->hasMany(TraitementVecteur::class);
	}

	public function redaction_cartographiques()
	{
		return $this->hasMany(RedactionCartographique::class);
	}

	public function controle_cartographiques()
	{
		return $this->hasMany(ControleCartographique::class);
	}

	public function validation_exports()
	{
		return $this->hasMany(ValidationExport::class);
	}

	public function coupure_fiches()
	{
		return $this->hasMany(CoupureFiche::class);
	}
}
