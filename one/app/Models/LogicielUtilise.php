<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogicielUtilise extends Model
{
    protected $table = 'logiciels_utilises';
    public $timestamps = false;

    protected $fillable = [
        'nom',
    ];
}
