# Database Schema Documentation

This directory contains comprehensive documentation of the multi-tenant hospital management system database schema. The documentation is organized by features to help AI agents understand the database structure and avoid common mistakes.

## 📁 Directory Structure

```
database-schema/
├── README.md                           # This overview file
├── core/                              # Core system tables
│   ├── tenants.md                     # Tenant management tables
│   ├── users.md                       # User management tables
│   └── roles.md                       # Role and permission tables
├── authentication/                    # Authentication-related tables
│   ├── user-verification.md           # Email verification and OTP tables
│   └── auth-flow.md                   # Authentication flow documentation
├── multi-tenancy/                     # Multi-tenant architecture
│   ├── schema-isolation.md            # How tenant schemas work
│   ├── tenant-creation.md             # Tenant creation process
│   └── data-isolation.md              # Data isolation patterns
├── migrations/                        # Migration documentation
│   ├── migration-history.md           # All migrations and their purpose
│   └── migration-patterns.md          # Common migration patterns
└── reference/                         # Quick reference guides
    ├── table-relationships.md         # ERD and relationships
    ├── naming-conventions.md          # Database naming standards
    └── common-queries.md              # Frequently used queries
```

## 🎯 Purpose

This documentation helps AI agents:
- **Avoid duplicate tables**: Check existing schema before creating new tables
- **Maintain naming consistency**: Follow established naming conventions
- **Understand relationships**: Know how tables connect to each other
- **Respect multi-tenancy**: Understand tenant isolation patterns
- **Follow migration patterns**: Use consistent migration approaches

## 🚀 Quick Start for AI Agents

### Before Creating New Tables
1. Check `core/` directory for existing user, tenant, or role tables
2. Review `reference/table-relationships.md` for existing relationships
3. Check `reference/naming-conventions.md` for naming standards
4. Review `multi-tenancy/schema-isolation.md` for tenant considerations

### Before Modifying Existing Tables
1. Check the relevant feature directory for current schema
2. Review `migrations/migration-history.md` for previous changes
3. Follow patterns in `migrations/migration-patterns.md`

### For Multi-Tenant Features
1. Read `multi-tenancy/schema-isolation.md` first
2. Understand tenant context from `multi-tenancy/data-isolation.md`
3. Follow tenant creation patterns from `multi-tenancy/tenant-creation.md`

## 📊 Current Database Status

- **Multi-Tenant Architecture**: ✅ Schema-based isolation (tenant schemas created)
- **Core Tables**: ⚠️ Only Tenants table implemented (Users, Roles pending migration)
- **Authentication**: ❌ User verification tables not yet created
- **Migrations**: ⚠️ Partial - only tenants table exists, other migrations failed
- **Relationships**: ❌ No foreign keys yet (dependent tables not created)

## 🔍 Key Concepts

### Multi-Tenant Schema Isolation
Each tenant gets a separate PostgreSQL schema (e.g., `tenant_123`). The `search_path` is set dynamically based on the `X-Tenant-ID` header.

### Table Naming Convention
- **snake_case**: All table and column names use snake_case
- **Singular names**: Table names are singular (e.g., `user`, not `users`)
- **Descriptive**: Clear, descriptive names that indicate purpose

### Primary Keys
- **Auto-incrementing integers**: Most tables use `id` as primary key
- **UUIDs**: Some tables use UUID for distributed systems
- **String IDs**: Tenant table uses string ID for human-readable identifiers

### Timestamps
- **created_at**: All tables have creation timestamp
- **updated_at**: Added when modification tracking is needed
- **Default values**: Use `current_timestamp` as default

## 🛡️ Security Considerations

- **Tenant Isolation**: Never allow cross-tenant data access
- **Input Validation**: All user inputs must be validated
- **SQL Injection**: Use parameterized queries only
- **Foreign Keys**: Maintain referential integrity with proper constraints

## 📝 Contributing

When adding new database features:
1. Update the relevant feature documentation
2. Add migration documentation to `migrations/migration-history.md`
3. Update relationships in `reference/table-relationships.md`
4. Follow naming conventions in `reference/naming-conventions.md`