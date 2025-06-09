<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dashboard extends Model
{
    protected $fillable = [
        'name',
        'description',
        'config',
        'data_source_id',
        'user_id'
    ];

    protected $casts = [
        'config' => 'json'
    ];

    public function dataSource()
    {
        return $this->belongsTo(DataSource::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function panels()
    {
        return $this->hasMany(Panel::class);
    }

    public function visualizations()
    {
        return $this->hasMany(Visualization::class);
    }
} 