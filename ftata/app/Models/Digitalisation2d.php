<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

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
 * @property int|null $equipement_id
 * 
 * @property Metadata $metadata
 * @property ModesRealisation|null $modes_realisation
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
		'equipement_id' => 'int'
	];

	protected $fillable = [
		'id',
		'metadata_id',
		'logiciel_utilise',
		'version_logiciel',
		'mode_realisation_id',
		'equipement_id'
	];

	public function metadata()
	{
		return $this->belongsTo(Metadata::class);
	}

	public function modes_realisation()
	{
		return $this->belongsTo(ModesRealisation::class, 'mode_realisation_id');
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
