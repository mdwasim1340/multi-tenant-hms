-- Application-Level Authorization Schema
-- Creates tables for role-based application access control

-- 1. Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- 2. Role permissions (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- 3. Applications registry
CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  url VARCHAR(255),
  port INTEGER,
  required_permissions TEXT[],
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'disabled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);

-- Insert default permissions
INSERT INTO permissions (resource, action, description) VALUES
  -- Admin Dashboard Permissions
  ('admin_dashboard', 'access', 'Access to admin dashboard application'),
  ('admin_dashboard', 'read', 'Read access to admin dashboard data'),
  ('admin_dashboard', 'write', 'Write access to admin dashboard data'),
  ('admin_dashboard', 'admin', 'Full administrative access to admin dashboard'),
  
  -- Hospital System Permissions
  ('hospital_system', 'access', 'Access to hospital management system'),
  ('hospital_system', 'read', 'Read access to hospital system data'),
  ('hospital_system', 'write', 'Write access to hospital system data'),
  ('hospital_system', 'admin', 'Administrative access to hospital system'),
  
  -- Patient Management
  ('patients', 'read', 'View patient information'),
  ('patients', 'write', 'Create and edit patient information'),
  ('patients', 'admin', 'Full patient management including deletion'),
  
  -- Appointment Management
  ('appointments', 'read', 'View appointments'),
  ('appointments', 'write', 'Create and edit appointments'),
  ('appointments', 'admin', 'Full appointment management'),
  
  -- Analytics
  ('analytics', 'read', 'View analytics and reports'),
  ('analytics', 'write', 'Create custom reports'),
  ('analytics', 'admin', 'Full analytics administration'),
  
  -- System Management
  ('system', 'read', 'View system information'),
  ('system', 'write', 'Modify system settings'),
  ('system', 'admin', 'Full system administration')
ON CONFLICT (resource, action) DO NOTHING;

-- Insert default applications
INSERT INTO applications (id, name, description, url, port, required_permissions, status) VALUES
  ('admin_dashboard', 'Admin Dashboard', 'System administration dashboard', 'http://localhost:3002', 3002, ARRAY['admin_dashboard:access'], 'active'),
  ('hospital_system', 'Hospital Management System', 'Multi-tenant hospital management application', 'http://localhost:3001', 3001, ARRAY['hospital_system:access'], 'active')
ON CONFLICT (id) DO NOTHING;

-- Assign permissions to roles
DO $$
DECLARE
    admin_role_id INTEGER;
    hospital_admin_role_id INTEGER;
    doctor_role_id INTEGER;
    nurse_role_id INTEGER;
    receptionist_role_id INTEGER;
    manager_role_id INTEGER;
    lab_tech_role_id INTEGER;
    pharmacist_role_id INTEGER;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin';
    SELECT id INTO hospital_admin_role_id FROM roles WHERE name = 'Hospital Admin';
    SELECT id INTO doctor_role_id FROM roles WHERE name = 'Doctor';
    SELECT id INTO nurse_role_id FROM roles WHERE name = 'Nurse';
    SELECT id INTO receptionist_role_id FROM roles WHERE name = 'Receptionist';
    SELECT id INTO manager_role_id FROM roles WHERE name = 'Manager';
    SELECT id INTO lab_tech_role_id FROM roles WHERE name = 'Lab Technician';
    SELECT id INTO pharmacist_role_id FROM roles WHERE name = 'Pharmacist';
    
    -- Admin (Super Admin): All permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions
    ON CONFLICT DO NOTHING;
    
    -- Hospital Admin: Hospital system + management
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT hospital_admin_role_id, id FROM permissions 
    WHERE resource IN ('hospital_system', 'patients', 'appointments', 'analytics', 'system')
    ON CONFLICT DO NOTHING;
    
    -- Doctor: Hospital system + clinical data
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT doctor_role_id, id FROM permissions 
    WHERE (resource = 'hospital_system' AND action IN ('access', 'read', 'write'))
       OR (resource = 'patients' AND action IN ('read', 'write'))
       OR (resource = 'appointments' AND action IN ('read', 'write'))
       OR (resource = 'analytics' AND action = 'read')
    ON CONFLICT DO NOTHING;
    
    -- Nurse: Hospital system + limited access
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT nurse_role_id, id FROM permissions 
    WHERE (resource = 'hospital_system' AND action IN ('access', 'read'))
       OR (resource = 'patients' AND action = 'read')
       OR (resource = 'appointments' AND action IN ('read', 'write'))
    ON CONFLICT DO NOTHING;
    
    -- Receptionist: Front desk operations
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT receptionist_role_id, id FROM permissions 
    WHERE (resource = 'hospital_system' AND action IN ('access', 'read'))
       OR (resource = 'patients' AND action IN ('read', 'write'))
       OR (resource = 'appointments' AND action IN ('read', 'write'))
    ON CONFLICT DO NOTHING;
    
    -- Manager: Hospital system + reports
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT manager_role_id, id FROM permissions 
    WHERE (resource = 'hospital_system' AND action IN ('access', 'read'))
       OR (resource = 'analytics' AND action IN ('read', 'write'))
    ON CONFLICT DO NOTHING;
    
    -- Lab Technician: Hospital system + lab module
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT lab_tech_role_id, id FROM permissions 
    WHERE (resource = 'hospital_system' AND action IN ('access', 'read'))
       OR (resource = 'patients' AND action = 'read')
    ON CONFLICT DO NOTHING;
    
    -- Pharmacist: Hospital system + pharmacy
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT pharmacist_role_id, id FROM permissions 
    WHERE (resource = 'hospital_system' AND action IN ('access', 'read'))
       OR (resource = 'patients' AND action = 'read')
    ON CONFLICT DO NOTHING;
END $$;

-- Create helper functions
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id INTEGER,
    p_resource VARCHAR(50),
    p_action VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
          AND p.resource = p_resource
          AND p.action = p_action
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INTEGER)
RETURNS TABLE(resource VARCHAR(50), action VARCHAR(50)) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.resource, p.action
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE permissions IS 'Granular permissions for resources and actions';
COMMENT ON TABLE role_permissions IS 'Many-to-many relationship between roles and permissions';
COMMENT ON TABLE applications IS 'Registry of applications in the system';
COMMENT ON FUNCTION check_user_permission IS 'Check if user has specific permission';
COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user';
