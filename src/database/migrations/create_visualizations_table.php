<?php

use Illuminate\Database\Capsule\Manager as Capsule;

// Check if table exists
if (!Capsule::schema()->hasTable('visualizations')) {
    // Create visualizations table
    Capsule::schema()->create('visualizations', function ($table) {
        $table->id();
        $table->string('name');
        $table->string('type');
        $table->json('config');
        $table->unsignedBigInteger('dashboard_id');
        $table->unsignedBigInteger('data_source_id');
        $table->timestamps();
        
        $table->foreign('dashboard_id')
              ->references('id')
              ->on('dashboards')
              ->onDelete('cascade');
              
        $table->foreign('data_source_id')
              ->references('id')
              ->on('data_sources')
              ->onDelete('cascade');
    });
    
    error_log("Created visualizations table");
} else {
    error_log("visualizations table already exists");
} 