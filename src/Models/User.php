<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $fillable = [
        'name',
        'email',
        'password'
    ];

    protected $hidden = [
        'password'
    ];

    public function dashboards()
    {
        return $this->hasMany(Dashboard::class);
    }

    public function dataSources()
    {
        return $this->hasMany(DataSource::class);
    }
} 