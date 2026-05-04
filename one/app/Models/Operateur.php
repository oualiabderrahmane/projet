<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Operateur extends Model
{
    protected $table = 'operateurs';
    public $timestamps = false;

    protected $fillable = [
        'nom',
        'grade',
        'fonction',
        'type',
    ];
}
