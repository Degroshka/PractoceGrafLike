<?php

namespace App\Controllers;

use App\Models\DataSource;
use App\Database\Database;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class DataSourceController extends BaseController
{
    public function create(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            // Validate required fields
            $requiredFields = ['name', 'type', 'host', 'port', 'database', 'username', 'password'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    return $this->respondWithError($response, "Missing required field: {$field}", 400);
                }
            }

            // Get user_id from token
            $token = $request->getHeaderLine('Authorization');
            if (empty($token)) {
                return $this->respondWithError($response, 'Authorization token is required', 401);
            }

            $token = str_replace('Bearer ', '', $token);
            $tokenParts = explode('.', $token);
            if (count($tokenParts) !== 3) {
                return $this->respondWithError($response, 'Invalid token format', 401);
            }

            $payload = json_decode(base64_decode($tokenParts[1]), true);
            if (!isset($payload['user_id'])) {
                return $this->respondWithError($response, 'User ID not found in token', 401);
            }

            $dataSource = new DataSource();
            $dataSource->name = $data['name'];
            $dataSource->type = $data['type'];
            $dataSource->host = $data['host'];
            $dataSource->port = $data['port'];
            $dataSource->database = $data['database'];
            $dataSource->username = $data['username'];
            $dataSource->password = $data['password'];
            $dataSource->use_ssl = isset($data['use_ssl']) ? (bool)$data['use_ssl'] : false;
            $dataSource->user_id = $payload['user_id'];
            $dataSource->save();

            return $this->respondWithData($response, $dataSource, 201);
        } catch (\Exception $e) {
            return $this->respondWithError($response, $e->getMessage());
        }
    }

    public function list(Request $request, Response $response): Response
    {
        try {
            $dataSources = DataSource::all();
            return $this->respondWithData($response, $dataSources);
        } catch (\Exception $e) {
            return $this->respondWithError($response, $e->getMessage());
        }
    }

    public function index(Request $request, Response $response): Response
    {
        try {
            $token = $request->getHeaderLine('Authorization');
            if (empty($token)) {
                return $this->respondWithError($response, 'Authorization token is required', 401);
            }

            $token = str_replace('Bearer ', '', $token);
            $tokenParts = explode('.', $token);
            if (count($tokenParts) !== 3) {
                return $this->respondWithError($response, 'Invalid token format', 401);
            }

            $payload = json_decode(base64_decode($tokenParts[1]), true);
            if (!isset($payload['user_id'])) {
                return $this->respondWithError($response, 'User ID not found in token', 401);
            }

            $dataSources = DataSource::where('user_id', $payload['user_id'])->get();
            return $this->respondWithData($response, $dataSources);
        } catch (\Exception $e) {
            return $this->respondWithError($response, $e->getMessage());
        }
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        try {
            $dataSource = DataSource::find($args['id']);
            if (!$dataSource) {
                return $this->respondWithError($response, 'Data source not found', 404);
            }

            return $this->respondWithData($response, $dataSource);
        } catch (\Exception $e) {
            return $this->respondWithError($response, $e->getMessage());
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $dataSource = DataSource::find($args['id']);
            if (!$dataSource) {
                return $this->respondWithError($response, 'Data source not found', 404);
            }

            $data = $request->getParsedBody();
            $dataSource->fill($data);
            $dataSource->save();

            return $this->respondWithData($response, $dataSource);
        } catch (\Exception $e) {
            return $this->respondWithError($response, $e->getMessage());
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $dataSource = DataSource::find($args['id']);
            if (!$dataSource) {
                return $this->respondWithError($response, 'Data source not found', 404);
            }

            $dataSource->delete();
            return $this->respondWithData($response, ['message' => 'Data source deleted successfully']);
        } catch (\Exception $e) {
            return $this->respondWithError($response, $e->getMessage());
        }
    }

    public function testConnection(Request $request, Response $response, array $args): Response
    {
        try {
            $dataSource = DataSource::find($args['id']);
            if (!$dataSource) {
                return $this->respondWithError($response, 'Data source not found', 404);
            }

            // Get request data
            $data = $request->getParsedBody();
            $includePassword = $data['include_password'] ?? false;

            // Add debug logging
            error_log('TestConnection config: ' . json_encode([
                'host' => $dataSource->host,
                'port' => $dataSource->port,
                'database' => $dataSource->database,
                'username' => $dataSource->username,
                'password_length' => strlen($dataSource->password ?? ''),
                'type' => $dataSource->type,
                'use_ssl' => $dataSource->use_ssl,
                'include_password' => $includePassword
            ]));

            // Ensure password is set
            if (empty($dataSource->password)) {
                return $this->respondWithError($response, 'Password is required for connection test');
            }

            // Create database connection
            $db = new Database([
                'type' => $dataSource->type,
                'host' => $dataSource->host,
                'port' => $dataSource->port,
                'database' => $dataSource->database,
                'username' => $dataSource->username,
                'password' => $dataSource->password,
                'use_ssl' => false // Explicitly disable SSL for testing
            ]);
            
            $db->connect();

            return $this->respondWithData($response, ['message' => 'Connection successful']);
        } catch (\Exception $e) {
            error_log('TestConnection error: ' . $e->getMessage());
            return $this->respondWithError($response, 'Connection failed: ' . $e->getMessage());
        }
    }

    public function getTables(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            if (!isset($data['data_source_id'])) {
                return $this->respondWithError($response, 'Data source ID is required', 400);
            }

            $dataSource = DataSource::find($data['data_source_id']);
            if (!$dataSource) {
                return $this->respondWithError($response, 'Data source not found', 404);
            }

            error_log("Data source type: " . $dataSource->type);
            
            // Get connection based on type
            $connection = $this->getConnection($dataSource);
            error_log("Connection established successfully");
            
            // Get tables
            $tables = [];
            if ($dataSource->type === 'mysql') {
                $stmt = $connection->query("SHOW TABLES");
                if ($stmt) {
                    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                        $tables[] = $row[0];
                    }
                }
            } elseif ($dataSource->type === 'postgresql') {
                $stmt = $connection->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
                if ($stmt) {
                    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                        $tables[] = $row[0];
                    }
                }
            }

            error_log("Tables found: " . implode(', ', $tables));
            return $this->respondWithData($response, $tables);
        } catch (\Exception $e) {
            error_log("Error getting tables: " . $e->getMessage());
            return $this->respondWithError($response, $e->getMessage());
        }
    }

    private function getConnection(DataSource $dataSource)
    {
        $dsn = '';
        if ($dataSource->type === 'mysql') {
            $dsn = "mysql:host={$dataSource->host};port={$dataSource->port};dbname={$dataSource->database}";
        } elseif ($dataSource->type === 'postgresql') {
            $dsn = "pgsql:host={$dataSource->host};port={$dataSource->port};dbname={$dataSource->database}";
        }

        $options = [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            \PDO::ATTR_EMULATE_PREPARES => false,
        ];

        if ($dataSource->use_ssl) {
            $options[\PDO::MYSQL_ATTR_SSL_CA] = '/path/to/ca.pem';
            $options[\PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        }

        try {
            return new \PDO($dsn, $dataSource->username, $dataSource->password, $options);
        } catch (\PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            throw new \Exception("Failed to connect to database: " . $e->getMessage());
        }
    }

    public function getTableData(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            error_log("Received data for table data: " . json_encode($data));
            
            if (!isset($data['data_source_id']) || !isset($data['table_name'])) {
                error_log("Missing required fields: data_source_id or table_name");
                return $this->respondWithError($response, 'Data source ID and table name are required', 400);
            }

            $dataSource = DataSource::find($data['data_source_id']);
            if (!$dataSource) {
                error_log("Data source not found: " . $data['data_source_id']);
                return $this->respondWithError($response, 'Data source not found', 404);
            }

            error_log("Getting data for table: " . $data['table_name'] . " from data source: " . $dataSource->name);
            
            // Get connection based on type
            $connection = $this->getConnection($dataSource);
            error_log("Connection established successfully");
            
            // Get table data
            $limit = isset($data['limit']) ? (int)$data['limit'] : 0;
            $query = "SELECT * FROM `" . $data['table_name'] . "`";
            if ($limit > 0) {
                $query .= " LIMIT " . $limit;
            }

            $stmt = $connection->query($query);
            if (!$stmt) {
                throw new \Exception("Failed to execute query: " . implode(" ", $connection->errorInfo()));
            }

            $rows = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $rows[] = $row;
            }

            error_log("Retrieved " . count($rows) . " rows from table");
            return $this->respondWithData($response, ['rows' => $rows]);
        } catch (\Exception $e) {
            error_log("Error getting table data: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            return $this->respondWithError($response, $e->getMessage());
        }
    }

    public function getTableStructure(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            error_log("Received data: " . json_encode($data));
            
            if (!isset($data['data_source_id']) || !isset($data['table_name'])) {
                error_log("Missing required fields: data_source_id or table_name");
                return $this->respondWithError($response, 'Data source ID and table name are required', 400);
            }

            $dataSource = DataSource::find($data['data_source_id']);
            if (!$dataSource) {
                error_log("Data source not found: " . $data['data_source_id']);
                return $this->respondWithError($response, 'Data source not found', 404);
            }

            error_log("Getting structure for table: " . $data['table_name'] . " from data source: " . $dataSource->name);
            
            // Get connection based on type
            $connection = $this->getConnection($dataSource);
            error_log("Connection established successfully");
            
            // Get table structure
            $columns = [];
            if ($dataSource->type === 'mysql') {
                $stmt = $connection->query("SHOW COLUMNS FROM `" . $data['table_name'] . "`");
                if ($stmt) {
                    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        $columns[] = [
                            'name' => $row['Field'],
                            'type' => $row['Type'],
                            'nullable' => $row['Null'] === 'YES',
                            'key' => $row['Key'],
                            'default' => $row['Default'],
                            'extra' => $row['Extra']
                        ];
                    }
                }
            } elseif ($dataSource->type === 'postgresql') {
                $stmt = $connection->query("
                    SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
                    FROM information_schema.columns
                    WHERE table_name = '" . $data['table_name'] . "'
                    ORDER BY ordinal_position
                ");
                if ($stmt) {
                    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        $columns[] = [
                            'name' => $row['column_name'],
                            'type' => $row['data_type'],
                            'nullable' => $row['is_nullable'] === 'YES',
                            'default' => $row['column_default'],
                            'max_length' => $row['character_maximum_length']
                        ];
                    }
                }
            }

            error_log("Columns found: " . implode(', ', array_column($columns, 'name')));
            return $this->respondWithData($response, $columns);
        } catch (\Exception $e) {
            error_log("Error getting table structure: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            return $this->respondWithError($response, $e->getMessage());
        }
    }
} 