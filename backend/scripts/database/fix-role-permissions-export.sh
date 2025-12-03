#!/bin/bash
sudo -u postgres psql -d hospital_management -c "\COPY (SELECT * FROM role_permissions ORDER BY role_id, permission_id) TO '/tmp/role_permissions.csv' WITH CSV HEADER;"
echo "Exported role_permissions"
ls -lh /tmp/role_permissions.csv
