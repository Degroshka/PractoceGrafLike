<?php

use Illuminate\Database\Capsule\Manager as Capsule;

if (!Capsule::schema()->hasTable('dashboards')) {
    Capsule::schema()->create('dashboards', function ($table) {
        $table->id();
        $table->string('name');
        $table->text('description')->nullable();
        $table->json('config');
        $table->foreignId('data_source_id')->constrained('data_sources')->onDelete('cascade');
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
        $table->timestamps();
    });
} 