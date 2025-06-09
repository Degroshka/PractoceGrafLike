-- Create test tables
CREATE TABLE IF NOT EXISTS test_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    value INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

-- Insert sample data
INSERT INTO test_table (name, value, timestamp) VALUES
    ('Test Item 1', 100, '2024-01-01 10:00:00'),
    ('Test Item 2', 200, '2024-01-01 11:00:00'),
    ('Test Item 3', 150, '2024-01-01 12:00:00'),
    ('Test Item 4', 300, '2024-01-01 13:00:00'),
    ('Test Item 5', 250, '2024-01-01 14:00:00');

-- Create metrics table for time series data
CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

-- Insert sample time series data
INSERT INTO metrics (metric_name, value, timestamp) VALUES
    ('CPU Usage', 45.5, '2024-01-01 10:00:00'),
    ('CPU Usage', 52.3, '2024-01-01 10:05:00'),
    ('CPU Usage', 48.7, '2024-01-01 10:10:00'),
    ('CPU Usage', 55.1, '2024-01-01 10:15:00'),
    ('CPU Usage', 50.2, '2024-01-01 10:20:00'),
    ('Memory Usage', 65.8, '2024-01-01 10:00:00'),
    ('Memory Usage', 68.2, '2024-01-01 10:05:00'),
    ('Memory Usage', 70.1, '2024-01-01 10:10:00'),
    ('Memory Usage', 72.5, '2024-01-01 10:15:00'),
    ('Memory Usage', 69.8, '2024-01-01 10:20:00'); 