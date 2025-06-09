<?php

use Illuminate\Database\Capsule\Manager as Capsule;

// Check if table exists
if (!Capsule::schema()->hasTable('data_sources')) {
    // Create data_sources table
    Capsule::schema()->create('data_sources', function ($table) {
        $table->id();
        $table->string('name');
        $table->string('type');
        $table->string('host');
        $table->integer('port');
        $table->string('db_name');
        $table->string('username');
        $table->string('password');
        $table->boolean('use_ssl')->default(false);
        $table->unsignedBigInteger('user_id')->nullable();
        $table->timestamps();
        
        $table->foreign('user_id')
              ->references('id')
              ->on('users')
              ->onDelete('cascade');
    });
    
    error_log("Created data_sources table");
} else {
    error_log("data_sources table already exists");
} 