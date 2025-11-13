# SQL File Naming Conventions
-
- Use `IF NOT EXISTS` for tables/indexes
- No cross-schema references unless explicitly required
- Place tenant-scoped files under `migrations/schemas/`
- Global files under `migrations/`
- Versioning noted in runner: `patients@1.0.0`, `appointments@1.0.0`, etc.

# Allowed Statements
- CREATE TABLE/INDEX, ALTER TABLE ADD COLUMN
- No DROP SCHEMA or ALTER SYSTEM

# Validation
- Files are validated before execution; non-compliant files are rejected
