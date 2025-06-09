-- First, let's check the structure of the dashboards table
SHOW CREATE TABLE dashboards;

-- Then create the visualizations table with matching column types
CREATE TABLE IF NOT EXISTS visualizations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    dashboard_id BIGINT UNSIGNED NOT NULL,
    data_source_id BIGINT UNSIGNED NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    columns JSON NOT NULL,
    type VARCHAR(50) NOT NULL,
    options JSON,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY visualizations_dashboard_id_foreign (dashboard_id),
    KEY visualizations_data_source_id_foreign (data_source_id),
    CONSTRAINT visualizations_dashboard_id_foreign FOREIGN KEY (dashboard_id) REFERENCES dashboards (id) ON DELETE CASCADE,
    CONSTRAINT visualizations_data_source_id_foreign FOREIGN KEY (data_source_id) REFERENCES data_sources (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci; 