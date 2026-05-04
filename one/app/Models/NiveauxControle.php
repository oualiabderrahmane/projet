<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class NiveauxControle
 * 
 * @property int $id
 * @property string $nom
 * 
 * @property Collection|ControleCartographique[] $controle_cartographiques
 *
 * @package App\Models
 */
class NiveauxControle extends Model
{
	protected $table = 'niveaux_controle';
	public $timestamps = false;

	protected $fillable = [
		'nom'
	];

	public function controle_cartographiques()
	{
		return $this->hasMany(ControleCartographique::class, 'niveau_controle_id');
	}
}
