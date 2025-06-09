<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Configure database connection
$capsule = new Capsule;
$capsule->addConnection([
    'driver'    => $_ENV['DB_CONNECTION'] ?? 'mysql',
    'host'      => $_ENV['DB_HOST'] ?? 'localhost',
    'port'      => $_ENV['DB_PORT'] ?? '3307',
    'database'  => $_ENV['DB_DATABASE'] ?? 'grafana_clone',
    'username'  => $_ENV['DB_USERNAME'] ?? 'root',
    'password'  => $_ENV['DB_PASSWORD'] ?? 'secret',
    'charset'   => 'utf8',
    'collation' => 'utf8_unicode_ci',
    'prefix'    => '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

// Run migrations
try {
    // Create users table if it doesn't exist
    if (!Capsule::schema()->hasTable('users')) {
        Capsule::schema()->create('users', function ($table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
        echo "Created users table\n";
    }

    // Create data_sources table if it doesn't exist
    if (!Capsule::schema()->hasTable('data_sources')) {
        Capsule::schema()->create('data_sources', function ($table) {
            $table->id();
            $table->string('name');
            $table->string('type');
            $table->string('connection_type')->default('local');
            $table->string('host');
            $table->integer('port');
            $table->string('database');
            $table->string('username');
            $table->string('password');
            $table->boolean('use_ssl')->default(false);
            $table->text('ssl_cert')->nullable();
            $table->text('ssl_key')->nullable();
            $table->text('ssl_ca')->nullable();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
        echo "Created data_sources table\n";
    } else {
        // Add new columns if they don't exist
        $schema = Capsule::schema();
        if (!$schema->hasColumn('data_sources', 'connection_type')) {
            $schema->table('data_sources', function ($table) {
                $table->string('connection_type')->default('local')->after('type');
            });
            echo "Added connection_type column\n";
        }
        if (!$schema->hasColumn('data_sources', 'use_ssl')) {
            $schema->table('data_sources', function ($table) {
                $table->boolean('use_ssl')->default(false)->after('password');
            });
            echo "Added use_ssl column\n";
        }
        if (!$schema->hasColumn('data_sources', 'ssl_cert')) {
            $schema->table('data_sources', function ($table) {
                $table->text('ssl_cert')->nullable()->after('use_ssl');
            });
            echo "Added ssl_cert column\n";
        }
        if (!$schema->hasColumn('data_sources', 'ssl_key')) {
            $schema->table('data_sources', function ($table) {
                $table->text('ssl_key')->nullable()->after('ssl_cert');
            });
            echo "Added ssl_key column\n";
        }
        if (!$schema->hasColumn('data_sources', 'ssl_ca')) {
            $schema->table('data_sources', function ($table) {
                $table->text('ssl_ca')->nullable()->after('ssl_key');
            });
            echo "Added ssl_ca column\n";
        }
    }

    echo "Migrations completed successfully!\n";
} catch (\Exception $e) {
    echo "Error running migrations: " . $e->getMessage() . "\n";
    exit(1);
} 