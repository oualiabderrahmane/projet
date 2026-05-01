<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

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
 * @property int|null $geonames_annee_mise_a_jour
 * @property string|null $gadm_version
 * @property bool $traite
 * 
 * @property Metadata $metadata
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
		'geonames_annee_mise_a_jour' => 'int',
		'traite' => 'bool'
	];

	protected $fillable = [
		'id',
		'metadata_id',
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

	public function coupure_fiches()
	{
		return $this->hasMany(CoupureFiche::class);
	}
}
