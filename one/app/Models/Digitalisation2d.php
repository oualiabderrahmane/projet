<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Digitalisation2d
 * 
 * @property int $id
 * @property int $metadata_id
 * @property string|null $logiciel_utilise
 * @property string|null $version_logiciel
 * @property int|null $mode_realisation_id
 * @property int|null $format_id
 * @property int|null $operateur_id
 * @property Carbon|null $date_debut
 * @property Carbon|null $date_fin
 * @property int|null $equipement_id
 * @property bool $traite
 * 
 * @property Metadata $metadata
 * @property ModesRealisation|null $modes_realisation
 * @property Format|null $format
 * @property Operateur|null $operateur
 * @property Equipement|null $equipement
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class Digitalisation2d extends Model
{
	protected $table = 'digitalisation_2d';
	public $timestamps = false;
	public $incrementing = false;
	protected $keyType = 'int';

	protected $casts = [
		'id' => 'int',
		'metadata_id' => 'int',
		'mode_realisation_id' => 'int',
		'format_id' => 'int',
		'operateur_id' => 'int',
		'date_debut' => 'datetime',
		'date_fin' => 'datetime',
		'equipement_id' => 'int',
		'traite' => 'bool'
	];

	protected $fillable = [
		'id',
		'metadata_id',
		'operateur_id',
		'date_debut',
		'date_fin',
		'logiciel_utilise',
		'version_logiciel',
		'mode_realisation_id',
		'format_id',
		'equipement_id',
		'traite'
	];

	public function metadata()
	{
		return $this->belongsTo(Metadata::class);
	}

	public function modes_realisation()
	{
		return $this->belongsTo(ModesRealisation::class, 'mode_realisation_id');
	}

	public function format()
	{
		return $this->belongsTo(Format::class);
	}

	public function operateur()
	{
		return $this->belongsTo(Operateur::class);
	}

	public function equipement()
	{
		return $this->belongsTo(Equipement::class);
	}

	public function coupure_fiches()
	{
		return $this->hasMany(CoupureFiche::class);
	}
}
