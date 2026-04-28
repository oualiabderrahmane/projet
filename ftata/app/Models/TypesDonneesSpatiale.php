<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class TypesDonneesSpatiale
 * 
 * @property int $id
 * @property string $nom
 * 
 * @property Collection|CompletementSpatial[] $completement_spatials
 *
 * @package App\Models
 */
class TypesDonneesSpatiale extends Model
{
	protected $table = 'types_donnees_spatiales';
	public $timestamps = false;

	protected $fillable = [
		'nom'
	];

	public function completement_spatials()
	{
		return $this->hasMany(CompletementSpatial::class, 'type_donnees_id');
	}
}
