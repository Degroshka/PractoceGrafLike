<?php

namespace App\Controllers;

use App\Models\DataSource;
use App\Database\Database;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;
use PDOException;

class DataSourceController extends BaseController
{
    public function create(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            // Validate required fields
            $requiredFields = ['name', 'type', 'host', 'port', 'database', 'username', 'password'];
            foreach ($requiredFields as $field) {
                if (empty($data[$field])) {
                    $response->getBody()->write(json_encode([
                        'success' => false,
                        'message' => "Missing required field: {$field}"
                    ]));
                    return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
                }
            }

            $dataSource = new DataSource();
            $dataSource->name = $data['name'];
            $dataSource->type = $data['type'];
            $dataSource->host = $data['host'];
            $dataSource->port = $data['port'];
            $dataSource->database = $data['database'];
            $dataSource->username = $data['username'];
            $dataSource->password = $data['password'];
            $dataSource->use_ssl = $data['use_ssl'] ?? false;
            $dataSource->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $dataSource
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Failed to create data source: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
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
            $dataSources = DataSource::all();
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $dataSources
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Failed to load data sources: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
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
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Data source not found'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $dataSource->delete();

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Data source deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Failed to delete data source: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function testConnection(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            // Validate required fields
            $requiredFields = ['type', 'host', 'port', 'database', 'username', 'password'];
            foreach ($requiredFields as $field) {
                if (empty($data[$field])) {
                    $response->getBody()->write(json_encode([
                        'success' => false,
                        'message' => "Missing required field: {$field}"
                    ]));
                    return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
                }
            }

            $dsn = $this->buildDsn($data);
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ];

            if ($data['type'] === 'mysql') {
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }

            $pdo = new PDO($dsn, $data['username'], $data['password'], $options);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Connection successful'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getTables(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            if (empty($data['data_source_id'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Data source ID is required'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $dataSource = DataSource::find($data['data_source_id']);
            if (!$dataSource) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Data source not found'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $dsn = $this->buildDsn($dataSource);
            $pdo = new PDO($dsn, $dataSource->username, $dataSource->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            $tables = [];
            if ($dataSource->type === 'mysql') {
                $stmt = $pdo->query("SHOW TABLES");
                while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                    $tables[] = $row[0];
                }
            } else if ($dataSource->type === 'postgresql') {
                $stmt = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
                while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                    $tables[] = $row[0];
                }
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $tables
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Failed to get tables: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getTableData(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            if (empty($data['data_source_id']) || empty($data['table_name'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Data source ID and table name are required'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $dataSource = DataSource::find($data['data_source_id']);
            if (!$dataSource) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Data source not found'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $dsn = $this->buildDsn($dataSource);
            $pdo = new PDO($dsn, $dataSource->username, $dataSource->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            $columns = !empty($data['columns']) ? implode(', ', array_map(function($col) {
                return "`{$col}`";
            }, $data['columns'])) : '*';

            $stmt = $pdo->query("SELECT {$columns} FROM `{$data['table_name']}` LIMIT 1000");
            $rows = $stmt->fetchAll();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $rows
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Failed to get table data: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getTableStructure(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            if (empty($data['data_source_id']) || empty($data['table_name'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Data source ID and table name are required'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $dataSource = DataSource::find($data['data_source_id']);
            if (!$dataSource) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Data source not found'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $dsn = $this->buildDsn($dataSource);
            $pdo = new PDO($dsn, $dataSource->username, $dataSource->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            $columns = [];
            if ($dataSource->type === 'mysql') {
                $stmt = $pdo->query("SHOW COLUMNS FROM `{$data['table_name']}`");
                while ($row = $stmt->fetch()) {
                    $columns[] = [
                        'name' => $row['Field'],
                        'type' => $row['Type']
                    ];
                }
            } else if ($dataSource->type === 'postgresql') {
                $stmt = $pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{$data['table_name']}'");
                while ($row = $stmt->fetch()) {
                    $columns[] = [
                        'name' => $row['column_name'],
                        'type' => $row['data_type']
                    ];
                }
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $columns
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Failed to get table structure: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    private function buildDsn($dataSource): string
    {
        if ($dataSource->type === 'mysql') {
            return "mysql:host={$dataSource->host};port={$dataSource->port};dbname={$dataSource->db_name}";
        } else if ($dataSource->type === 'postgresql') {
            return "pgsql:host={$dataSource->host};port={$dataSource->port};dbname={$dataSource->db_name}";
        }

        throw new \Exception("Unsupported database type: {$dataSource->type}");
    }
} 