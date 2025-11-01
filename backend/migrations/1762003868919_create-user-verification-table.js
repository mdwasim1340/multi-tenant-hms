/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('user_verification', {
    id: 'id',
    email: { type: 'varchar(255)', notNull: true },
    code: { type: 'varchar(255)', notNull: true },
    type: { type: 'varchar(50)', notNull: true },
    expires_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp + interval \'1 hour\''),
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('user_verification');
};
