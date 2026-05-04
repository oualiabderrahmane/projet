<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class TypesOsm
 * 
 * @property int $id
 * @property string $nom
 * 
 * @property Collection|CollectePreparation[] $collecte_preparations
 *
 * @package App\Models
 */
class TypesOsm extends Model
{
	protected $table = 'types_osm';
	public $timestamps = false;

	protected $fillable = [
		'nom'
	];

	public function collecte_preparations()
	{
		return $this->hasMany(CollectePreparation::class, 'type_osm_id');
	}
}
