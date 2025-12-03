#!/bin/bash
sudo -u postgres psql -d hospital_management -c "SELECT id, name, subdomain FROM tenants WHERE subdomain IS NOT NULL ORDER BY name;"
