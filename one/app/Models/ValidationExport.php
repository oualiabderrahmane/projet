<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ValidationExport
 * 
 * @property int $id
 * @property int $metadata_id
 * @property int|null $operateur_id
 * @property string|null $emplacement
 * @property string|null $format
 * 
 * @property Metadata $metadata
 * @property User|null $operateur
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class ValidationExport extends Model
{
	protected $table = 'validation_export';
	public $timestamps = false;
	public $incrementing = false;
	protected $keyType = 'int';

	protected $casts = [
		'id' => 'int',
		'metadata_id' => 'int',
		'operateur_id' => 'int'
	];

	protected $fillable = [
		'id',
		'metadata_id',
		'operateur_id',
		'emplacement',
		'format'
	];

	public function metadata()
	{
		return $this->belongsTo(Metadata::class);
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
