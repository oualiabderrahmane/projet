<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    protected $fillable = [
        'nom',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

}
