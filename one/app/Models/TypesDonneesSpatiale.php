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

	public function completements()
{
    return $this->belongsToMany(
        CompletementSpatial::class,
        'completement_spatial_type',
        'type_donnees_id',
        'completement_spatial_id'
    );
}

	public function completements_spatials()
	{
		return $this->belongsToMany(
			CompletementSpatial::class,
			'completement_spatial_type_donnee',
			'type_donnees_id',
			'completement_spatial_id'
		);
	}
}
