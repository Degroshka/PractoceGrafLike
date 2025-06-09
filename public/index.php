<?php

// If the request is for the root path, serve the frontend
if ($_SERVER['REQUEST_URI'] === '/' || $_SERVER['REQUEST_URI'] === '/index.html') {
    include __DIR__ . '/index.html';
    exit;
}

require __DIR__ . '/../vendor/autoload.php';

// Get app instance from bootstrap
$app = require __DIR__ . '/../src/bootstrap.php';

// Run app
$app->run(); 