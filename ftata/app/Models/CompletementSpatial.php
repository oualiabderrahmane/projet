<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class CompletementSpatial
 * 
 * @property int $id
 * @property int $metadata_id
 * @property int|null $type_donnees_id
 * 
 * @property Metadata $metadata
 * @property TypesDonneesSpatiale|null $types_donnees_spatiale
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class CompletementSpatial extends Model
{
	protected $table = 'completement_spatial';
	public $timestamps = false;

	protected $casts = [
		'metadata_id' => 'int',
		'type_donnees_id' => 'int'
	];

	protected $fillable = [
		'metadata_id',
		'type_donnees_id'
	];

	public function metadata()
	{
		return $this->belongsTo(Metadata::class);
	}

	public function types_donnees_spatiale()
	{
		return $this->belongsTo(TypesDonneesSpatiale::class, 'type_donnees_id');
	}

	public function coupure_fiches()
	{
		return $this->hasMany(CoupureFiche::class);
	}
}
