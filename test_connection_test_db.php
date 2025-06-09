<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Test MySQL connection
echo "Testing MySQL connection...\n";
try {
    $dsn = 'mysql:host=test-mysql;port=3306;dbname=test_db;charset=utf8mb4';
    $username = 'root';
    $password = 'secret';
    
    echo "Attempting to connect to MySQL...\n";
    echo "DSN: $dsn\n";
    echo "Username: $username\n";
    
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    echo "MySQL Connection successful!\n";
    
    // Create test user
    $pdo->exec("CREATE USER IF NOT EXISTS 'test_user'@'%' IDENTIFIED BY 'test_password'");
    $pdo->exec("GRANT ALL PRIVILEGES ON test_db.* TO 'test_user'@'%'");
    $pdo->exec("FLUSH PRIVILEGES");
    
    echo "Test user created successfully!\n";
    
    // Test connection with test user
    $dsn = 'mysql:host=test-mysql;port=3306;dbname=test_db;charset=utf8mb4';
    $username = 'test_user';
    $password = 'test_password';
    
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    echo "Test user connection successful!\n";
    
    // Create test table
    $pdo->exec("DROP TABLE IF EXISTS test_table");
    $pdo->exec("CREATE TABLE test_table (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), value VARCHAR(255) NOT NULL)");
    echo "Test table created successfully!\n";
    
    // Insert test data
    $stmt = $pdo->prepare("INSERT INTO test_table (name, value) VALUES (?, ?)");
    $stmt->execute(['Test Data', 'Test Value']);
    echo "Test data inserted successfully!\n";
    
    // Query test data
    $stmt = $pdo->query('SELECT * FROM test_table');
    $data = $stmt->fetchAll();
    echo "Test data retrieved:\n";
    print_r($data);
    
} catch (PDOException $e) {
    echo "MySQL Connection failed: " . $e->getMessage() . "\n";
    echo "Error code: " . $e->getCode() . "\n";
}

// Test PostgreSQL connection
echo "\nTesting PostgreSQL connection...\n";
try {
    $dsn = 'pgsql:host=test-postgres;port=5432;dbname=test_db';
    $username = 'postgres';
    $password = 'secret';
    
    echo "Attempting to connect to PostgreSQL...\n";
    echo "DSN: $dsn\n";
    echo "Username: $username\n";
    
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    echo "PostgreSQL Connection successful!\n";
    
    // Create test table
    $pdo->exec("DROP TABLE IF EXISTS test_table");
    $pdo->exec("CREATE TABLE test_table (id SERIAL PRIMARY KEY, name VARCHAR(255), value VARCHAR(255) NOT NULL)");
    echo "Test table created successfully!\n";
    
    // Insert test data
    $stmt = $pdo->prepare("INSERT INTO test_table (name, value) VALUES (?, ?)");
    $stmt->execute(['Test Data', 'Test Value']);
    echo "Test data inserted successfully!\n";
    
    // Query test data
    $stmt = $pdo->query('SELECT * FROM test_table');
    $data = $stmt->fetchAll();
    echo "Test data retrieved:\n";
    print_r($data);
    
} catch (PDOException $e) {
    echo "PostgreSQL Connection failed: " . $e->getMessage() . "\n";
    echo "Error code: " . $e->getCode() . "\n";
} 