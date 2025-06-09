 
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSslFieldsToDataSources extends Migration
{
    public function up()
    {
        Schema::table('data_sources', function (Blueprint $table) {
            $table->string('connection_type')->default('local')->after('type');
            $table->boolean('use_ssl')->default(false)->after('password');
            $table->text('ssl_cert')->nullable()->after('use_ssl');
            $table->text('ssl_key')->nullable()->after('ssl_cert');
            $table->text('ssl_ca')->nullable()->after('ssl_key');
        });
    }

    public function down()
    {
        Schema::table('data_sources', function (Blueprint $table) {
            $table->dropColumn([
                'connection_type',
                'use_ssl',
                'ssl_cert',
                'ssl_key',
                'ssl_ca'
            ]);
        });
    }
} 
<?php
 