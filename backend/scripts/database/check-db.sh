#!/bin/bash
PGPASSWORD=password psql -h localhost -U postgres -d multitenant_db -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'users';"
