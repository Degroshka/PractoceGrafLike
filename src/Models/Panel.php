<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Panel extends Model
{
    protected $fillable = [
        'title',
        'type',
        'query',
        'options',
        'dashboard_id',
        'data_source_id'
    ];

    protected $casts = [
        'options' => 'array',
        'query' => 'array'
    ];

    public function dashboard()
    {
        return $this->belongsTo(Dashboard::class);
    }

    public function dataSource()
    {
        return $this->belongsTo(DataSource::class);
    }

    public function executeQuery()
    {
        $dataSource = $this->dataSource;
        if (!$dataSource) {
            throw new \Exception('Data source not found');
        }

        $pdo = $dataSource->getConnection();
        $query = $this->buildQuery();
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    protected function buildQuery()
    {
        $query = $this->query;
        $type = $this->type;

        switch ($type) {
            case 'line':
            case 'bar':
                return $this->buildTimeSeriesQuery($query);
            case 'pie':
                return $this->buildPieQuery($query);
            case 'table':
                return $this->buildTableQuery($query);
            default:
                throw new \Exception("Unsupported visualization type: {$type}");
        }
    }

    protected function buildTimeSeriesQuery($query)
    {
        $select = $query['select'] ?? '*';
        $from = $query['from'];
        $where = $query['where'] ?? '';
        $groupBy = $query['groupBy'] ?? '';
        $orderBy = $query['orderBy'] ?? '';

        return "SELECT {$select} FROM {$from} {$where} {$groupBy} {$orderBy}";
    }

    protected function buildPieQuery($query)
    {
        $select = $query['select'] ?? '*';
        $from = $query['from'];
        $where = $query['where'] ?? '';
        $groupBy = $query['groupBy'] ?? '';

        return "SELECT {$select} FROM {$from} {$where} {$groupBy}";
    }

    protected function buildTableQuery($query)
    {
        $select = $query['select'] ?? '*';
        $from = $query['from'];
        $where = $query['where'] ?? '';
        $orderBy = $query['orderBy'] ?? '';
        $limit = $query['limit'] ?? '';

        return "SELECT {$select} FROM {$from} {$where} {$orderBy} {$limit}";
    }
} 