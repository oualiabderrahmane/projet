<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Pay
 * 
 * @property int $id
 * @property string $nom
 * 
 * @property Collection|Metadata[] $metadata
 *
 * @package App\Models
 */
class Pay extends Model
{
	protected $table = 'pays';
	public $timestamps = false;

	protected $fillable = [
		'nom'
	];

	public function metadata()
	{
		return $this->hasMany(Metadata::class, 'pays_id');
	}
}
