<?php

namespace App\Database;

use PDO;
use PDOException;

class Database {
    private $connection;
    private $type;
    private $host;
    private $port;
    private $database;
    private $username;
    private $password;
    private $useSsl;
    private $config;

    public function __construct(array $config) {
        $this->config = [
            'type' => $config['type'] ?? 'mysql',
            'host' => $config['host'] ?? 'localhost',
            'port' => $config['port'] ?? 3306,
            'database' => $config['db_name'] ?? $config['database'] ?? '',
            'username' => $config['username'] ?? '',
            'password' => $config['password'] ?? '',
            'use_ssl' => $config['use_ssl'] ?? false,
            'ssl_cert' => $config['ssl_cert'] ?? null,
            'ssl_key' => $config['ssl_key'] ?? null,
            'ssl_ca' => $config['ssl_ca'] ?? null
        ];
    }

    public function connect() {
        if ($this->connection === null) {
            $dsn = $this->getDsn();
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            // Only add SSL options if explicitly enabled
            if ($this->config['use_ssl'] ?? false) {
                $options[PDO::MYSQL_ATTR_SSL_CA] = $this->config['ssl_ca'] ?? null;
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
            } else {
                // Explicitly disable SSL
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }

            try {
                $this->connection = new PDO(
                    $dsn,
                    $this->config['username'],
                    $this->config['password'],
                    $options
                );
            } catch (PDOException $e) {
                throw new PDOException("Connection failed: " . $e->getMessage());
            }
        }

        return $this->connection;
    }

    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            throw new PDOException("Query failed: " . $e->getMessage());
        }
    }

    public function quote($value) {
        if (!$this->connection) {
            $this->connect();
        }

        // Если значение содержит точку, разбиваем на схему и имя таблицы
        if (strpos($value, '.') !== false) {
            list($schema, $table) = explode('.', $value);
            return "`{$schema}`.`{$table}`";
        }

        return "`{$value}`";
    }

    public function getTables() {
        try {
            $sql = "SHOW TABLES";
            $stmt = $this->query($sql);
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            throw new PDOException("Failed to get tables: " . $e->getMessage());
        }
    }

    public function getColumns($table) {
        if (!$this->connection) {
            $this->connect();
        }

        $columns = [];
        $dbType = $this->config['type'];

        // Если таблица содержит точку, разбиваем на схему и имя таблицы
        $schema = null;
        $tableName = $table;
        if (strpos($table, '.') !== false) {
            list($schema, $tableName) = explode('.', $table);
        }

        if ($dbType === 'mysql') {
            if ($schema) {
                $sql = "SHOW COLUMNS FROM `{$schema}`.`{$tableName}`";
            } else {
                $sql = "SHOW COLUMNS FROM `{$tableName}`";
            }
            $stmt = $this->connection->query($sql);
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $columns[] = [
                    'name' => $row['Field'],
                    'type' => $row['Type'],
                    'null' => $row['Null'],
                    'key' => $row['Key'],
                    'default' => $row['Default'],
                    'extra' => $row['Extra']
                ];
            }
        } else if ($dbType === 'postgresql') {
            if ($schema) {
                $sql = "SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
                        FROM information_schema.columns
                        WHERE table_schema = :schema AND table_name = :table
                        ORDER BY ordinal_position";
                $stmt = $this->connection->prepare($sql);
                $stmt->execute(['schema' => $schema, 'table' => $tableName]);
            } else {
                $sql = "SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
                        FROM information_schema.columns
                        WHERE table_name = :table
                        ORDER BY ordinal_position";
                $stmt = $this->connection->prepare($sql);
                $stmt->execute(['table' => $tableName]);
            }
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $columns[] = [
                    'name' => $row['column_name'],
                    'type' => $row['data_type'],
                    'null' => $row['is_nullable'],
                    'default' => $row['column_default'],
                    'length' => $row['character_maximum_length']
                ];
            }
        }

        return $columns;
    }

    public function close() {
        $this->connection = null;
    }

    protected function getDsn(): string {
        $type = strtolower($this->config['type']);
        $host = $this->config['host'];
        $port = $this->config['port'];
        $database = $this->config['database'];

        switch ($type) {
            case 'mysql':
                return "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
            case 'postgresql':
                return "pgsql:host={$host};port={$port};dbname={$database}";
            default:
                throw new PDOException("Unsupported database type: {$type}");
        }
    }

    public function disableSSL()
    {
        $this->config['use_ssl'] = false;
        $this->config['ssl_cert'] = null;
        $this->config['ssl_key'] = null;
        $this->config['ssl_ca'] = null;
    }
} 