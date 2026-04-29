-- Seed Data for Mini BPM Platform

-- Sample Process Definitions
INSERT INTO process_definitions (name, version, status, description) VALUES
('Purchase Request Approval', 1, 'PUBLISHED', 'Simple purchase request with approval workflow'),
('API Data Sync', 1, 'PUBLISHED', 'Data synchronization via REST API with error handling'),
('Customer Onboarding', 1, 'PUBLISHED', 'Multi-step customer onboarding process');

-- Sample Form Definitions
INSERT INTO form_definitions (name, version, schema, description) VALUES
('Purchase Request Form', 1,
  '{
    "title": "Purchase Request",
    "description": "Submit a new purchase request",
    "fields": [
      {"name": "description", "label": "Item Description", "type": "textarea", "required": true},
      {"name": "quantity", "label": "Quantity", "type": "number", "required": true},
      {"name": "cost", "label": "Unit Cost", "type": "number", "required": true},
      {"name": "department", "label": "Department", "type": "select", "required": true, "options": [{"label": "IT", "value": "it"}, {"label": "HR", "value": "hr"}, {"label": "Finance", "value": "finance"}]},
      {"name": "justification", "label": "Business Justification", "type": "textarea", "required": true}
    ]
  }',
  'Form for submitting new purchase requests'),
('Approval Form', 1,
  '{
    "title": "Approval Decision",
    "description": "Approve or reject the request",
    "fields": [
      {"name": "approved", "label": "Approve Request?", "type": "checkbox", "required": true},
      {"name": "comments", "label": "Comments", "type": "textarea", "required": false},
      {"name": "approvalDate", "label": "Approval Date", "type": "date", "required": true}
    ]
  }',
  'Form for approving or rejecting requests');

-- Sample Rule Definitions
INSERT INTO rule_definitions (name, version, rules, description) VALUES
('Amount-Based Routing', 1,
  '{
    "rules": [
      {"condition": "amount > 500", "action": "route_to_director"},
      {"condition": "amount <= 500 AND amount > 100", "action": "route_to_manager"},
      {"condition": "amount <= 100", "action": "auto_approve"}
    ],
    "default_action": "route_to_director"
  }',
  'Route approval requests based on purchase amount');
