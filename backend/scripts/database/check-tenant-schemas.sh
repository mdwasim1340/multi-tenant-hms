#!/bin/bash
echo "=== Tenant Schemas ==="
sudo -u postgres psql -d hospital_management -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE '%sunrise%' OR schema_name LIKE '%aajmin%';"

echo ""
echo "=== Tables in sunrise_medical_center schema ==="
sudo -u postgres psql -d hospital_management -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'sunrise_medical_center' ORDER BY table_name;"

echo ""
echo "=== Check for medical_record_attachments table ==="
sudo -u postgres psql -d hospital_management -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%attachment%';"

echo ""
echo "=== Check for lab_test_definitions table ==="
sudo -u postgres psql -d hospital_management -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%lab_test%';"
