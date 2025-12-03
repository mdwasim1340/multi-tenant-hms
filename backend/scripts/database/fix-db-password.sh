#!/bin/bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'password';"
echo "Password updated"
