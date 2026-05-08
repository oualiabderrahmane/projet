<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Coupure
 * 
 * @property int $id
 * @property int $feuille_id
 * @property string $nom
 * @property string|null $latitude_nord
 * @property string|null $longitude_ouest
 * @property string|null $longitude_est
 * @property string|null $latitude_sud
 * 
 * @property Feuille $feuille
 * @property Collection|Metadata[] $metadata
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class Coupure extends Model
{
	protected $table = 'coupures';
	public $timestamps = false;
	public $incrementing = false;
	protected $keyType = 'int';

	protected $casts = [
		'feuille_id' => 'int'
	];

	protected $fillable = [
		'id',
		'feuille_id',
		'nom',
		'label',
		'latitude_nord',
		'longitude_ouest',
		'longitude_est',
		'latitude_sud',
	];

	public function feuille()
	{
		return $this->belongsTo(Feuille::class);
	}

	public function metadata()
	{
		return $this->hasMany(Metadata::class);
	}

	public function coupure_fiches()
	{
		return $this->hasMany(CoupureFiche::class);
	}
}
