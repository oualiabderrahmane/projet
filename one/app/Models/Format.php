<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Format
 *
 * @property int $id
 * @property string $nom
 *
 * @property Collection|Digitalisation2d[] $digitalisation2ds
 * @property Collection|TraitementVecteur[] $traitement_vecteurs
 * @property Collection|RedactionCartographique[] $redaction_cartographiques
 *
 * @package App\Models
 */
class Format extends Model
{
    protected $table = 'formats';
    public $timestamps = false;

    protected $fillable = [
        'nom',
    ];

    public function digitalisation2ds()
    {
        return $this->hasMany(Digitalisation2d::class);
    }

    public function traitement_vecteurs()
    {
        return $this->hasMany(TraitementVecteur::class);
    }

    public function redaction_cartographiques()
    {
        return $this->hasMany(RedactionCartographique::class);
    }
}
