-- Minimal application identity registry for assignee/candidate group selection.

CREATE TABLE IF NOT EXISTS identity_groups (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY idx_identity_groups_active (active)
);

CREATE TABLE IF NOT EXISTS identity_users (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uni_identity_users_email (email),
    KEY idx_identity_users_active (active)
);

CREATE TABLE IF NOT EXISTS identity_user_groups (
    user_id VARCHAR(100) NOT NULL,
    group_id VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, group_id),
    CONSTRAINT fk_identity_user_groups_user
        FOREIGN KEY (user_id) REFERENCES identity_users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_identity_user_groups_group
        FOREIGN KEY (group_id) REFERENCES identity_groups(id)
        ON DELETE CASCADE
);

INSERT IGNORE INTO identity_groups (id, name, description) VALUES
('managers', 'Managers', 'Default approval group for demo workflows');

INSERT IGNORE INTO identity_users (id, display_name, email) VALUES
('demo.user', 'Demo User', 'demo.user@example.local'),
('manager.user', 'Manager User', 'manager.user@example.local');

INSERT IGNORE INTO identity_user_groups (user_id, group_id) VALUES
('demo.user', 'managers'),
('manager.user', 'managers');
