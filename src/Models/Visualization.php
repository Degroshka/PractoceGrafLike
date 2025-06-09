<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Visualization extends Model
{
    protected $fillable = [
        'dashboard_id',
        'data_source_id',
        'table_name',
        'columns',
        'type',
        'options'
    ];

    protected $casts = [
        'columns' => 'array',
        'options' => 'array'
    ];

    public function dashboard()
    {
        return $this->belongsTo(Dashboard::class);
    }

    public function dataSource()
    {
        return $this->belongsTo(DataSource::class);
    }
} 