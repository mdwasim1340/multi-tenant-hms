#!/bin/bash
sudo -u postgres psql -d multitenant_db -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'users';"
echo "---"
sudo -u postgres psql -d multitenant_db -c "\dt public.*"
