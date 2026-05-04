<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ModesExtraction
 * 
 * @property int $id
 * @property string $nom
 * 
 * @property Collection|ExtractionAltimetrique[] $extraction_altimetriques
 *
 * @package App\Models
 */
class ModesExtraction extends Model
{
	protected $table = 'modes_extraction';
	public $timestamps = false;

	protected $fillable = [
		'nom'
	];

	public function extraction_altimetriques()
	{
		return $this->hasMany(ExtractionAltimetrique::class, 'mode_extraction_id');
	}
}
