<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ModesRealisation
 * 
 * @property int $id
 * @property string $nom
 * 
 * @property Collection|Digitalisation2d[] $digitalisation2ds
 *
 * @package App\Models
 */
class ModesRealisation extends Model
{
	protected $table = 'modes_realisation';
	public $timestamps = false;

	protected $fillable = [
		'nom'
	];

	public function digitalisation2ds()
	{
		return $this->hasMany(Digitalisation2d::class, 'mode_realisation_id');
	}
}
