<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $dsn = 'mysql:host=mysql;port=3306;dbname=test_db;charset=utf8mb4';
    $username = 'test_user';
    $password = 'test_password';
    
    echo "Attempting to connect to MySQL...\n";
    echo "DSN: $dsn\n";
    echo "Username: $username\n";
    
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    echo "Connection successful!\n";
    
    // Test query
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll();
    
    echo "Tables in database:\n";
    print_r($tables);
    
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
    echo "Error code: " . $e->getCode() . "\n";
} 