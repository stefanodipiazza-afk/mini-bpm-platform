ALTER TABLE process_definitions
    ADD COLUMN flowable_deployment_id VARCHAR(255),
    ADD COLUMN flowable_process_definition_id VARCHAR(255),
    ADD COLUMN flowable_process_definition_key VARCHAR(255),
    ADD COLUMN flowable_process_definition_version INT,
    ADD COLUMN published_at DATETIME;
