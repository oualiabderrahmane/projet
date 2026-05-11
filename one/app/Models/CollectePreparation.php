<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class CollectePreparation
 * 
 * @property int $id
 * @property int $metadata_id
 * @property string|null $imagerie
 * @property string|null $resolution
 * @property int|null $type_osm_id
 * @property int|null $operateur_id
 * @property Carbon|null $date_debut
 * @property Carbon|null $date_fin
 * @property string|null $geonames_annee_mise_a_jour
 * @property string|null $gadm_version
 * @property bool $traite
 * 
 * @property Metadata $metadata
 * @property User|null $operateur
 * @property TypesOsm|null $types_osm
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class CollectePreparation extends Model
{
	protected $table = 'collecte_preparation';
	public $timestamps = false;
	public $incrementing = false;
	protected $keyType = 'int';

	protected $casts = [
		'id' => 'int',
		'metadata_id' => 'int',
		'type_osm_id' => 'int',
		'operateur_id' => 'int',
		'date_debut' => 'datetime',
		'date_fin' => 'datetime',
		'traite' => 'bool'
	];

	protected $fillable = [
		'id',
		'metadata_id',
		'operateur_id',
		'date_debut',
		'date_fin',
		'imagerie',
		'resolution',
		'type_osm_id',
		'geonames_annee_mise_a_jour',
		'gadm_version',
		'traite'
	];

	public function metadata()
	{
		return $this->belongsTo(Metadata::class);
	}

	public function types_osm()
	{
		return $this->belongsTo(TypesOsm::class, 'type_osm_id');
	}

	public function operateur()
	{
		return $this->belongsTo(User::class, 'operateur_id');
	}

	public function coupure_fiches()
	{
		return $this->hasMany(CoupureFiche::class);
	}
}
