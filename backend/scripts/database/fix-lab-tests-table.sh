#!/bin/bash
echo "=== Creating lab_test_definitions view/alias for all tenant schemas ==="

# Get all tenant schemas
SCHEMAS=$(sudo -u postgres psql -d hospital_management -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'public');")

for schema in $SCHEMAS; do
    schema=$(echo $schema | xargs)  # trim whitespace
    if [ -n "$schema" ]; then
        echo "Processing schema: $schema"
        sudo -u postgres psql -d hospital_management -c "
            SET search_path TO \"$schema\";
            -- Create view if lab_tests exists but lab_test_definitions doesn't
            DO \$\$
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '$schema' AND table_name = 'lab_tests')
                   AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '$schema' AND table_name = 'lab_test_definitions')
                   AND NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = '$schema' AND table_name = 'lab_test_definitions')
                THEN
                    -- Rename lab_tests to lab_test_definitions
                    ALTER TABLE lab_tests RENAME TO lab_test_definitions;
                    RAISE NOTICE 'Renamed lab_tests to lab_test_definitions in schema %', '$schema';
                END IF;
            END \$\$;
        "
    fi
done

echo ""
echo "=== Verifying lab_test_definitions exists ==="
sudo -u postgres psql -d hospital_management -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'lab_test_definitions' ORDER BY table_schema;"
