<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Feuille
 * 
 * @property int $id
 * @property string $nom
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property Collection|Coupure[] $coupures
 * @property Collection|CoupureFiche[] $coupure_fiches
 *
 * @package App\Models
 */
class Feuille extends Model
{
	protected $table = 'feuilles';
	public $incrementing = false;
	protected $keyType = 'int';

	protected $fillable = [
		'id',
		'nom'
	];

	public function coupures()
	{
		return $this->hasMany(Coupure::class);
	}

	public function coupure_fiches()
	{
		return $this->hasMany(CoupureFiche::class);
	}
}
