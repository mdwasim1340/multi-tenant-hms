#!/bin/bash
echo "=== Exporting Production Data ==="

# Export tenants
echo "Exporting tenants..."
sudo -u postgres psql -d hospital_management -c "\COPY (SELECT * FROM tenants ORDER BY id) TO '/tmp/tenants.csv' WITH CSV HEADER;"

# Export users
echo "Exporting users..."
sudo -u postgres psql -d hospital_management -c "\COPY (SELECT * FROM users ORDER BY id) TO '/tmp/users.csv' WITH CSV HEADER;"

# Export roles
echo "Exporting roles..."
sudo -u postgres psql -d hospital_management -c "\COPY (SELECT * FROM roles ORDER BY id) TO '/tmp/roles.csv' WITH CSV HEADER;"

# Export user_roles
echo "Exporting user_roles..."
sudo -u postgres psql -d hospital_management -c "\COPY (SELECT * FROM user_roles ORDER BY id) TO '/tmp/user_roles.csv' WITH CSV HEADER;"

# Export permissions
echo "Exporting permissions..."
sudo -u postgres psql -d hospital_management -c "\COPY (SELECT * FROM permissions ORDER BY id) TO '/tmp/permissions.csv' WITH CSV HEADER;"

# Export role_permissions
echo "Exporting role_permissions..."
sudo -u postgres psql -d hospital_management -c "\COPY (SELECT * FROM role_permissions ORDER BY id) TO '/tmp/role_permissions.csv' WITH CSV HEADER;"

# Export applications
echo "Exporting applications..."
sudo -u postgres psql -d hospital_management -c "\COPY (SELECT * FROM applications ORDER BY id) TO '/tmp/applications.csv' WITH CSV HEADER;"

# Export subscription_tiers
echo "Exporting subscription_tiers..."
sudo -u postgres psql -d hospital_management -c "\COPY (SELECT * FROM subscription_tiers ORDER BY id) TO '/tmp/subscription_tiers.csv' WITH CSV HEADER;"

# Export tenant_subscriptions
echo "Exporting tenant_subscriptions..."
sudo -u postgres psql -d hospital_management -c "\COPY (SELECT * FROM tenant_subscriptions ORDER BY id) TO '/tmp/tenant_subscriptions.csv' WITH CSV HEADER;"

echo ""
echo "✅ Export complete! Files in /tmp/"
ls -lh /tmp/*.csv
