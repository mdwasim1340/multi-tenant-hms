exports.up = (pgm) => {
  pgm.createTable('tenants', {
    id: { type: 'string', notNull: true, primaryKey: true },
    name: { type: 'string', notNull: true },
    email: { type: 'string', notNull: true },
    plan: { type: 'string', notNull: true },
    status: { type: 'string', notNull: true },
    joinDate: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('tenants');
};
