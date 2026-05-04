<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ControleCartographique
 * 
 * @property int $id
 * @property int $metadata_id
 * @property int|null $type_controle_id
 * @property int|null $niveau_controle_id
 * @property Carbon|null $date_controle
 * @property Carbon|null $date_edition
 * 
 * @property Metadata $metadata
 * @property TypesControle|null $types_controle
 * @property NiveauxControle|null $niveaux_controle
 * @property Collection|ControleNiveaux[] $controle_niveauxes
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class ControleCartographique extends Model
{
	protected $table = 'controle_cartographique';
	public $timestamps = false;

	protected $casts = [
		'metadata_id' => 'int',
		'type_controle_id' => 'int',
		'niveau_controle_id' => 'int',
		'date_controle' => 'datetime',
		'date_edition' => 'datetime'
	];

	protected $fillable = [
		'metadata_id',
		'type_controle_id',
		'niveau_controle_id',
		'date_controle',
		'date_edition'
	];

	public function metadata()
	{
		return $this->belongsTo(Metadata::class);
	}

	public function types_controle()
	{
		return $this->belongsTo(TypesControle::class, 'type_controle_id');
	}

	public function niveaux_controle()
	{
		return $this->belongsTo(NiveauxControle::class, 'niveau_controle_id');
	}

	public function controle_niveauxes()
	{
		return $this->hasMany(ControleNiveaux::class);
	}

	public function coupure_fiches()
	{
		return $this->hasMany(CoupureFiche::class);
	}
}
