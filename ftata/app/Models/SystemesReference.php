<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class SystemesReference
 * 
 * @property int $id
 * @property string $nom
 * @property string|null $type
 * @property int|null $zone
 * 
 * @property Collection|Metadata[] $metadata
 *
 * @package App\Models
 */
class SystemesReference extends Model
{
	protected $table = 'systemes_reference';
	public $timestamps = false;

	protected $casts = [
		'zone' => 'int'
	];

	protected $fillable = [
		'nom',
		'type',
		'zone'
	];

	public function metadata()
	{
		return $this->hasMany(Metadata::class, 'systeme_reference_id');
	}
}
