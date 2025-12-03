#!/bin/bash
echo "=== Checking users table ==="
sudo -u postgres psql -d hospital_management -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'users';"
echo ""
echo "=== Listing public tables ==="
sudo -u postgres psql -d hospital_management -c "\dt public.*"
