DROP TABLE IF EXISTS data_sources;

CREATE TABLE data_sources (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    connection_type VARCHAR(255) NOT NULL DEFAULT 'local',
    host VARCHAR(255) NOT NULL,
    port INT NOT NULL,
    database VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    use_ssl TINYINT(1) NOT NULL DEFAULT 0,
    ssl_cert TEXT NULL,
    ssl_key TEXT NULL,
    ssl_ca TEXT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 