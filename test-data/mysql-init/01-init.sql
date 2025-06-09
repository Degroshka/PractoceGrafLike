-- Create test tables
CREATE TABLE IF NOT EXISTS metrics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    value DOUBLE NOT NULL,
    timestamp DATETIME NOT NULL,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_table (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data into metrics
INSERT INTO metrics (name, value, timestamp, tags) VALUES
('cpu_usage', 45.5, NOW() - INTERVAL 1 HOUR, '{"host": "server1", "type": "system"}'),
('memory_usage', 78.2, NOW() - INTERVAL 1 HOUR, '{"host": "server1", "type": "system"}'),
('disk_usage', 62.8, NOW() - INTERVAL 1 HOUR, '{"host": "server1", "type": "system"}'),
('cpu_usage', 52.3, NOW() - INTERVAL 30 MINUTE, '{"host": "server1", "type": "system"}'),
('memory_usage', 82.1, NOW() - INTERVAL 30 MINUTE, '{"host": "server1", "type": "system"}'),
('disk_usage', 63.5, NOW() - INTERVAL 30 MINUTE, '{"host": "server1", "type": "system"}'),
('cpu_usage', 48.7, NOW(), '{"host": "server1", "type": "system"}'),
('memory_usage', 79.8, NOW(), '{"host": "server1", "type": "system"}'),
('disk_usage', 64.2, NOW(), '{"host": "server1", "type": "system"}');

-- Insert sample data into test_table
INSERT INTO test_table (name, description, status) VALUES
('Test Service 1', 'Main application service', 'active'),
('Test Service 2', 'Backup service', 'active'),
('Test Service 3', 'Monitoring service', 'pending'),
('Test Service 4', 'Logging service', 'inactive'); 