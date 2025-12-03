#!/bin/bash
echo "=== All Users and their Tenants ==="
sudo -u postgres psql -d hospital_management -c "SELECT u.id, u.email, u.name, u.tenant_id, t.name as tenant_name FROM users u LEFT JOIN tenants t ON u.tenant_id = t.id ORDER BY u.tenant_id;"

echo ""
echo "=== All Tenants ==="
sudo -u postgres psql -d hospital_management -c "SELECT id, name, subdomain, status FROM tenants ORDER BY id;"

echo ""
echo "=== User Roles ==="
sudo -u postgres psql -d hospital_management -c "SELECT u.email, r.name as role_name FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id ORDER BY u.email;"
