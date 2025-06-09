<?php

use Slim\App;
use App\Controllers\DataSourceController;

return function (App $app) {
    // Data Source routes
    $app->group('/api/datasources', function ($group) {
        $group->post('', [DataSourceController::class, 'create']);
        $group->get('', [DataSourceController::class, 'list']);
        $group->get('/{id}', [DataSourceController::class, 'get']);
        $group->put('/{id}', [DataSourceController::class, 'update']);
        $group->delete('/{id}', [DataSourceController::class, 'delete']);
    });
}; 