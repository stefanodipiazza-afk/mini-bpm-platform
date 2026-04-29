-- Initial schema for Mini BPM Platform

CREATE TABLE IF NOT EXISTS process_definitions (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version INT DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    bpmn_xml LONGTEXT,
    definition LONGTEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uni_name_version (name, version)
);

CREATE TABLE IF NOT EXISTS process_instances (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    flowable_process_instance_id VARCHAR(255),
    process_definition_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    variables LONGTEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (process_definition_id) REFERENCES process_definitions(id),
    KEY idx_process_def (process_definition_id),
    KEY idx_status (status)
);

CREATE TABLE IF NOT EXISTS user_tasks (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    flowable_task_id VARCHAR(255),
    process_instance_id BIGINT NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    assigned_to VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    form_schema LONGTEXT,
    form_data LONGTEXT,
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (process_instance_id) REFERENCES process_instances(id),
    KEY idx_process_instance (process_instance_id),
    KEY idx_status (status),
    KEY idx_assigned_to (assigned_to)
);

CREATE TABLE IF NOT EXISTS form_definitions (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version INT DEFAULT 1,
    form_schema LONGTEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uni_form_name_version (name, version)
);

CREATE TABLE IF NOT EXISTS rule_definitions (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version INT DEFAULT 1,
    rules LONGTEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uni_rule_name_version (name, version)
);

CREATE TABLE IF NOT EXISTS execution_logs (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    process_instance_id BIGINT NOT NULL,
    task_id BIGINT,
    event_type VARCHAR(100) NOT NULL,
    event_data LONGTEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_instance_id) REFERENCES process_instances(id),
    FOREIGN KEY (task_id) REFERENCES user_tasks(id),
    KEY idx_process_instance (process_instance_id),
    KEY idx_timestamp (timestamp)
);
