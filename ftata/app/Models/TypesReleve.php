<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class TypesReleve
 * 
 * @property int $id
 * @property string $nom
 * 
 * @property Collection|Metadata[] $metadata
 *
 * @package App\Models
 */
class TypesReleve extends Model
{
	protected $table = 'types_releve';
	public $timestamps = false;

	protected $fillable = [
		'nom'
	];

	public function metadata()
	{
		return $this->hasMany(Metadata::class, 'type_releve_id');
	}
}
