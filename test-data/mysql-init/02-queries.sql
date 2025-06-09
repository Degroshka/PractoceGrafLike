-- Query 1: Get latest metrics for each metric type
SELECT 
    name,
    value,
    timestamp,
    JSON_UNQUOTE(JSON_EXTRACT(tags, '$.host')) as host,
    JSON_UNQUOTE(JSON_EXTRACT(tags, '$.type')) as type
FROM metrics
WHERE timestamp >= NOW() - INTERVAL 1 HOUR
ORDER BY timestamp DESC;

-- Query 2: Get average metrics by type for the last hour
SELECT 
    name,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value
FROM metrics
WHERE timestamp >= NOW() - INTERVAL 1 HOUR
GROUP BY name;

-- Query 3: Get active services with their metrics
SELECT 
    t.name as service_name,
    t.description,
    t.status,
    m.name as metric_name,
    m.value,
    m.timestamp
FROM test_table t
LEFT JOIN metrics m ON JSON_UNQUOTE(JSON_EXTRACT(m.tags, '$.host')) = t.name
WHERE t.status = 'active'
ORDER BY m.timestamp DESC;

-- Query 4: Get service status summary
SELECT 
    status,
    COUNT(*) as count
FROM test_table
GROUP BY status;

-- Query 5: Get metrics trend over time
SELECT 
    name,
    DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i') as time_bucket,
    AVG(value) as avg_value
FROM metrics
WHERE timestamp >= NOW() - INTERVAL 1 HOUR
GROUP BY name, time_bucket
ORDER BY time_bucket; 