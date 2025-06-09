<?php

return [
    'default' => env('DB_CONNECTION', 'mysql'),
    
    'connections' => [
        'mysql' => [
            'driver' => 'mysql',
            'host' => env('DB_HOST', 'mysql'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'grafana_clone'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', 'secret'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
        ],
        
        'postgres' => [
            'driver' => 'pgsql',
            'host' => env('POSTGRES_HOST', 'postgres'),
            'port' => env('POSTGRES_PORT', '5432'),
            'database' => env('POSTGRES_DB', 'grafana_clone'),
            'username' => env('POSTGRES_USER', 'postgres'),
            'password' => env('POSTGRES_PASSWORD', 'secret'),
            'charset' => 'utf8',
            'prefix' => '',
            'schema' => 'public',
        ],
        
        'sqlite' => [
            'driver' => 'sqlite',
            'database' => __DIR__ . '/../../database/database.sqlite',
            'prefix' => '',
        ],
    ],
]; 