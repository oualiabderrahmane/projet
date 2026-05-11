<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Poste extends Model
{
    protected $fillable = [
        'nom',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

}
