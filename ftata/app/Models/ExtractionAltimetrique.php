<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ExtractionAltimetrique
 * 
 * @property int $id
 * @property int $metadata_id
 * @property string|null $mnt
 * @property string|null $resolution
 * @property string|null $logiciel_utilise
 * @property string|null $version_logiciel
 * @property int|null $mode_extraction_id
 * 
 * @property Metadata $metadata
 * @property ModesExtraction|null $modes_extraction
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class ExtractionAltimetrique extends Model
{
	protected $table = 'extraction_altimetrique';
	public $timestamps = false;

	protected $casts = [
		'metadata_id' => 'int',
		'mode_extraction_id' => 'int'
	];

	protected $fillable = [
		'metadata_id',
		'mnt',
		'resolution',
		'logiciel_utilise',
		'version_logiciel',
		'mode_extraction_id'
	];

	public function metadata()
	{
		return $this->belongsTo(Metadata::class);
	}

	public function modes_extraction()
	{
		return $this->belongsTo(ModesExtraction::class, 'mode_extraction_id');
	}

	public function coupure_fiches()
	{
		return $this->hasMany(CoupureFiche::class);
	}
}
