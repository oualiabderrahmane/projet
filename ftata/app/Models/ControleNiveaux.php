<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class ControleNiveaux
 * 
 * @property int $id
 * @property int $controle_cartographique_id
 * @property string|null $niveau_controle
 * 
 * @property ControleCartographique $controle_cartographique
 *
 * @package App\Models
 */
class ControleNiveaux extends Model
{
	protected $table = 'controle_niveaux';
	public $timestamps = false;

	protected $casts = [
		'controle_cartographique_id' => 'int'
	];

	protected $fillable = [
		'controle_cartographique_id',
		'niveau_controle'
	];

	public function controle_cartographique()
	{
		return $this->belongsTo(ControleCartographique::class);
	}
}
