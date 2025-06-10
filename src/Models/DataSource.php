<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use PDO;
use PDOException;

class DataSource extends Model
{
    protected $table = 'data_sources';
    
    protected $connection = 'default';

    protected $fillable = [
        'name',
        'type',
        'host',
        'port',
        'database',
        'username',
        'password',
        'use_ssl',
        'user_id'
    ];

    protected $hidden = [
        'password'
    ];

    protected $casts = [
        'use_ssl' => 'boolean',
        'port' => 'integer'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function testConnection()
    {
        try {
            $pdo = $this->createTestConnection();
            $pdo->query('SELECT 1');
            return true;
        } catch (PDOException $e) {
            throw new \Exception('Connection test failed: ' . $e->getMessage());
        }
    }

    protected function createTestConnection()
    {
        $dsn = $this->getDsn();
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        // Only add SSL options if explicitly enabled
        if ($this->use_ssl) {
            $options[PDO::MYSQL_ATTR_SSL_CA] = '/path/to/ca.pem';
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
        }
        
        return new PDO($dsn, $this->username, $this->password, $options);
    }

    protected function getDsn()
    {
        switch ($this->type) {
            case 'mysql':
                return "mysql:host={$this->host};port={$this->port};dbname={$this->database};charset=utf8mb4;ssl-mode=DISABLED";
            case 'postgresql':
                return "pgsql:host={$this->host};port={$this->port};dbname={$this->database}";
            default:
                throw new \Exception("Unsupported database type: {$this->type}");
        }
    }

    public function getConnectionConfig()
    {
        return [
            'type' => $this->type,
            'host' => $this->host,
            'port' => $this->port,
            'database' => $this->database,
            'username' => $this->username,
            'password' => $this->password,
            'use_ssl' => $this->use_ssl
        ];
    }
} 