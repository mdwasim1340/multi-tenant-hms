exports.up = (pgm) => {
  // Create roles table
  pgm.createTable('roles', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create tenants table
  pgm.createTable('tenants', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Drop existing users table and recreate with new structure
  pgm.dropTable('users');
  
  pgm.createTable('users', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password: { type: 'varchar(255)', notNull: true },
    status: { type: 'varchar(50)', notNull: true, default: 'active' },
    phone_number: { type: 'varchar(50)' },
    last_login_date: { type: 'timestamp' },
    profile_picture_url: { type: 'text' },
    tenant_id: {
      type: 'integer',
      notNull: true,
      references: '"tenants"',
      onDelete: 'cascade',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create user_roles junction table
  pgm.createTable('user_roles', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'cascade',
    },
    role_id: {
      type: 'integer',
      notNull: true,
      references: '"roles"',
      onDelete: 'cascade',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes
  pgm.createIndex('users', 'tenant_id');
  pgm.createIndex('user_roles', 'user_id');
  pgm.createIndex('user_roles', 'role_id');
};

exports.down = (pgm) => {
  pgm.dropTable('user_roles');
  pgm.dropTable('users');
  pgm.dropTable('tenants');
  pgm.dropTable('roles');
  
  // Recreate original users table
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });
};