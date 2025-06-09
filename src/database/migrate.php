<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;

// Database configuration
$config = [
    'driver'    => 'mysql',
    'host'      => 'localhost', // Changed from mysql to localhost
    'port'      => '3307',      // Changed from 3306 to 3307
    'database'  => 'grafana_clone',
    'username'  => 'root',
    'password'  => 'secret',
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix'    => '',
];

echo "Connecting to database with config:\n";
echo "Host: {$config['host']}\n";
echo "Port: {$config['port']}\n";
echo "Database: {$config['database']}\n";
echo "Username: {$config['username']}\n";

try {
    // Initialize Capsule
    $capsule = new Capsule;
    $capsule->addConnection($config);
    $capsule->setAsGlobal();
    $capsule->bootEloquent();

    // Test connection
    $capsule->connection()->getPdo();
    echo "Database connection successful\n";

    // Run migrations
    require_once __DIR__ . '/migrations/create_users_table.php';
    require_once __DIR__ . '/migrations/create_data_sources_table.php';
    require_once __DIR__ . '/migrations/create_dashboards_table.php';
    require_once __DIR__ . '/migrations/create_visualizations_table.php';

    echo "Migrations completed successfully\n";
} catch (\Exception $e) {
    echo "Error running migrations: " . $e->getMessage() . "\n";
    exit(1);
} 