<?php

// Start session at the very beginning
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

use Slim\Factory\AppFactory;
use Slim\Routing\RouteCollectorProxy;
use Dotenv\Dotenv;
use Illuminate\Database\Capsule\Manager as Capsule;
use App\Controllers\AuthController;
use App\Controllers\DataSourceController;
use App\Controllers\DashboardController;
use App\Database\Database;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Middleware\MethodOverrideMiddleware;

require __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Create App
$app = AppFactory::create();

// Initialize Eloquent
$capsule = new Capsule;
$capsule->addConnection([
    'driver'    => 'mysql',
    'host'      => $_ENV['DB_HOST'] ?? 'mysql',
    'port'      => $_ENV['DB_PORT'] ?? '3306',
    'database'  => $_ENV['DB_DATABASE'] ?? 'grafana_clone',
    'username'  => $_ENV['DB_USERNAME'] ?? 'root',
    'password'  => $_ENV['DB_PASSWORD'] ?? 'secret',
    'charset'   => 'utf8',
    'collation' => 'utf8_unicode_ci',
    'prefix'    => '',
]);

// Make this Capsule instance available globally
$capsule->setAsGlobal();

// Boot Eloquent
$capsule->bootEloquent();

// Run migrations
require __DIR__ . '/database/migrations/create_users_table.php';
require __DIR__ . '/database/migrations/create_data_sources_table.php';
require __DIR__ . '/database/migrations/create_dashboards_table.php';

// Add middleware
$app->addErrorMiddleware(true, true, true);
$app->add(new MethodOverrideMiddleware());

// Add CORS middleware
$app->add(function (Request $request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        ->withHeader('Content-Type', 'application/json');
});

// Add routes
$app->group('/api', function (RouteCollectorProxy $group) {
    // Auth routes
    $group->post('/auth/register', 'App\Controllers\AuthController:register');
    $group->post('/auth/login', 'App\Controllers\AuthController:login');

    // Data source routes
    $group->get('/data-sources', 'App\Controllers\DataSourceController:index');
    $group->post('/data-sources', 'App\Controllers\DataSourceController:create');
    $group->delete('/data-sources/{id}', 'App\Controllers\DataSourceController:delete');
    $group->post('/data-sources/test-connection', 'App\Controllers\DataSourceController:testConnection');
    $group->post('/data-sources/tables', 'App\Controllers\DataSourceController:getTables');
    $group->post('/data-sources/table-structure', 'App\Controllers\DataSourceController:getTableStructure');
    $group->post('/data-sources/table-data', 'App\Controllers\DataSourceController:getTableData');

    // Dashboard routes
    $group->get('/dashboards', 'App\Controllers\DashboardController:index');
    $group->post('/dashboards', 'App\Controllers\DashboardController:create');
    $group->get('/dashboards/{id}', 'App\Controllers\DashboardController:show');
    $group->delete('/dashboards/{id}', 'App\Controllers\DashboardController:delete');

    // Visualization routes
    $group->post('/visualizations', 'App\Controllers\VisualizationController:create');
    $group->get('/visualizations/{id}', 'App\Controllers\VisualizationController:show');
    $group->delete('/visualizations/{id}', 'App\Controllers\VisualizationController:delete');
});

// Add catch-all route for SPA
$app->get('[/{path:.*}]', function (Request $request, Response $response) {
    $response->getBody()->write(file_get_contents(__DIR__ . '/../public/index.html'));
    return $response->withHeader('Content-Type', 'text/html');
});

return $app; 