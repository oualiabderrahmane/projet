<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class RedactionCartographique
 * 
 * @property int $id
 * @property int $metadata_id
 * @property string|null $logiciel_utilise
 * @property string|null $version_logiciel
 * @property int|null $equipement_id
 * @property bool $traite
 * 
 * @property Metadata $metadata
 * @property Equipement|null $equipement
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class RedactionCartographique extends Model
{
	protected $table = 'redaction_cartographique';
	public $timestamps = false;

	protected $casts = [
		'metadata_id' => 'int',
		'equipement_id' => 'int',
		'traite' => 'bool'
	];

	protected $fillable = [
		'metadata_id',
		'logiciel_utilise',
		'version_logiciel',
		'equipement_id',
		'traite'
	];

	public function metadata()
	{
		return $this->belongsTo(Metadata::class);
	}

	public function equipement()
	{
		return $this->belongsTo(Equipement::class);
	}

	public function coupure_fiches()
	{
		return $this->hasMany(CoupureFiche::class);
	}
}
