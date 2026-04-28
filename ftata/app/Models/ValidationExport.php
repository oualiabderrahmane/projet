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
 * @property string|null $emplacement
 * @property string|null $format
 * 
 * @property Metadata $metadata
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class ValidationExport extends Model
{
	protected $table = 'validation_export';
	public $timestamps = false;

	protected $casts = [
		'metadata_id' => 'int'
	];

	protected $fillable = [
		'metadata_id',
		'emplacement',
		'format'
	];

	public function metadata()
	{
		return $this->belongsTo(Metadata::class);
	}

	public function coupure_fiches()
	{
		return $this->hasMany(CoupureFiche::class);
	}
}
