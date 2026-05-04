<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class CompletementSpatial
 *
 * @property int $id
 * @property int $metadata_id
 * @property int|null $type_donnees_id
 * @property int|null $operateur_id
 * @property Carbon|null $date_debut
 * @property Carbon|null $date_fin
 * @property bool $traite
 *
 * @property Metadata $metadata
 * @property Operateur|null $operateur
 * @property TypesDonneesSpatiale|null $types_donnees_spatiale
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class CompletementSpatial extends Model
{
	protected $table = 'completement_spatial';
	public $timestamps = false;
	public $incrementing = false;
	protected $keyType = 'int';

	protected $casts = [
		'id' => 'int',
		'metadata_id' => 'int',
		'operateur_id' => 'int',
		'date_debut' => 'datetime',
		'date_fin' => 'datetime',
		'traite' => 'bool',
	];

	protected $fillable = [
		'id',
		'metadata_id',
		'operateur_id',
		'date_debut',
		'date_fin',
		'traite',
	];

	public function metadata()
	{
		return $this->belongsTo(Metadata::class);
	}

	public function operateur()
	{
		return $this->belongsTo(Operateur::class);
	}

	public function types()
{
    return $this->belongsToMany(
        TypesDonneesSpatiales::class,
        'completement_spatial_type',
        'completement_spatial_id',
        'type_donnees_id'
    );
}

	public function types_donnees_spatiales()
	{
		return $this->belongsToMany(
			TypesDonneesSpatiale::class,
			'completement_spatial_type_donnee',
			'completement_spatial_id',
			'type_donnees_id'
		);
	}

	public function coupure_fiches()
	{
		return $this->hasMany(CoupureFiche::class);
	}
}
