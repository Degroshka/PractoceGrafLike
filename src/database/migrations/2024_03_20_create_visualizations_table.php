<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateVisualizationsTable extends Migration
{
    public function up()
    {
        Schema::create('visualizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dashboard_id')->constrained()->onDelete('cascade');
            $table->foreignId('data_source_id')->constrained()->onDelete('cascade');
            $table->string('table_name');
            $table->json('columns');
            $table->string('type');
            $table->json('options')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('visualizations');
    }
} 