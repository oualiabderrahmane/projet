<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class TraitementVecteur
 * 
 * @property int $id
 * @property int $metadata_id
 * @property string|null $logiciel_utilise
 * @property string|null $version_logiciel
 * @property int|null $mode_realisation_id
 * @property string|null $tolerance_topologique
 * @property int|null $equipement_id
 * @property bool $traite
 * 
 * @property Metadata $metadata
 * @property ModeRealisation|null $mode_realisation
 * @property Equipement|null $equipement
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class TraitementVecteur extends Model
{
	protected $table = 'traitement_vecteur';
	public $timestamps = false;
	public $incrementing = false;
	protected $keyType = 'int';

	protected $casts = [
		'metadata_id' => 'int',
		'mode_realisation_id' => 'int',
		'equipement_id' => 'int',
		'traite' => 'bool'
	];

	protected $fillable = [
		'id',
		'metadata_id',
		'logiciel_utilise',
		'version_logiciel',
		'mode_realisation_id',
		'tolerance_topologique',
		'equipement_id',
		'traite'
	];

	public function metadata()
	{
		return $this->belongsTo(Metadata::class);
	}

	public function mode_realisation()
	{
		return $this->belongsTo(ModeRealisation::class);
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
