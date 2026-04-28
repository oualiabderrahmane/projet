<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Collection;
use Laravel\Sanctum\HasApiTokens;
/**
 * Class User
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $password_hash
 * @property string|null $phone
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @property Collection|Role[] $roles
 *
 * @package App\Models
 */
class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
	protected $table = 'users';

	protected $fillable = [
		'name',
		'email',
		'password_hash',
		'phone'
	];
    protected $hidden = [
        'password',
        'remember_token'
  ];
	public function roles()
	{
		return $this->belongsToMany(Role::class, 'user_roles');
	}
}
