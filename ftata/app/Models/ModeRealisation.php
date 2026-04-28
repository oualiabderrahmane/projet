<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ModeRealisation
 * 
 * @property int $id
 * @property string $nom
 * 
 * @property Collection|TraitementVecteur[] $traitement_vecteurs
 *
 * @package App\Models
 */
class ModeRealisation extends Model
{
	protected $table = 'mode_realisation';
	public $timestamps = false;

	protected $fillable = [
		'nom'
	];

	public function traitement_vecteurs()
	{
		return $this->hasMany(TraitementVecteur::class);
	}
}
