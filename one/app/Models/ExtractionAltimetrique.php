<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
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
 * @property int|null $operateur_id
 * @property Carbon|null $date_debut
 * @property Carbon|null $date_fin
 * @property bool $traite
 * 
 * @property Metadata $metadata
 * @property ModesExtraction|null $modes_extraction
 * @property User|null $operateur
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class ExtractionAltimetrique extends Model
{
	protected $table = 'extraction_altimetrique';
	public $timestamps = false;
	public $incrementing = false;
	protected $keyType = 'int';

	protected $casts = [
		'metadata_id' => 'int',
		'mode_extraction_id' => 'int',
		'operateur_id' => 'int',
		'date_debut' => 'datetime',
		'date_fin' => 'datetime',
		'traite' => 'bool'
	];

	protected $fillable = [
		'id',
		'metadata_id',
		'operateur_id',
		'date_debut',
		'date_fin',
		'mnt',
		'resolution',
		'logiciel_utilise',
		'version_logiciel',
		'mode_extraction_id',
		'traite'
	];

	public function metadata()
	{
		return $this->belongsTo(Metadata::class);
	}

	public function modes_extraction()
	{
		return $this->belongsTo(ModesExtraction::class, 'mode_extraction_id');
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
