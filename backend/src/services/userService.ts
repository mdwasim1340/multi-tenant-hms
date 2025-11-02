import pool from '../database';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const ALLOWED_SORT_FIELDS = ['name', 'email', 'tenant', 'role', 'status', 'joinDate', 'created_at'];
const ALLOWED_ORDER_DIRECTIONS = ['asc', 'desc'];

export const getUsers = async (queryParams: any) => {
  const { page = 1, limit = 10, sortBy = 'created_at', order = 'desc', ...filters } = queryParams;
  const offset = (page - 1) * limit;

  if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
    throw new Error(`Invalid sort field: ${sortBy}`);
  }
  if (!ALLOWED_ORDER_DIRECTIONS.includes(order)) {
    throw new Error(`Invalid order direction: ${order}`);
  }

  // Map frontend field names to database column names
  const sortFieldMap: { [key: string]: string } = {
    'joinDate': 'created_at',
    'created_at': 'created_at',
    'name': 'name',
    'email': 'email',
    'tenant': 'tenant',
    'role': 'role',
    'status': 'status'
  };
  
  const dbSortField = sortFieldMap[sortBy] || sortBy;

  let query = 'SELECT u.*, r.name as role, t.name as tenant, u.created_at as joinDate FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id LEFT JOIN tenants t ON u.tenant_id = t.id';
  const queryParamsArray: any[] = [];

  if (Object.keys(filters).length > 0) {
    query += ' WHERE ';
    const filterClauses = Object.entries(filters).map(([key, value], index) => {
      queryParamsArray.push(value);
      return `u.${key} = $${index + 1}`;
    });
    query += filterClauses.join(' AND ');
  }

  const totalResult = await pool.query(`SELECT COUNT(*) FROM (${query}) as total`, queryParamsArray);
  const total = parseInt(totalResult.rows[0].count, 10);

  const activeResult = await pool.query(`SELECT COUNT(*) FROM users WHERE status = 'active'`, []);
  const active = parseInt(activeResult.rows[0].count, 10);

  const adminsResult = await pool.query(`SELECT COUNT(*) FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'Admin'`, []);
  const admins = parseInt(adminsResult.rows[0].count, 10);

  query += ` ORDER BY u.${dbSortField} ${order} LIMIT $${queryParamsArray.length + 1} OFFSET $${queryParamsArray.length + 2}`;
  queryParamsArray.push(limit, offset);

  const { rows } = await pool.query(query, queryParamsArray);
  return { users: rows, total, active, admins };
};

export const getUser = async (id: string) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
};

export const createUser = async (userData: any) => {
  const { name, email, password, status, phone_number, last_login_date, profile_picture_url, role_id, tenant_id } = userData;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password, status, phone_number, last_login_date, profile_picture_url, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [name, email, hashedPassword, status, phone_number, last_login_date, profile_picture_url, tenant_id]
  );
  const user = rows[0];

  if (role_id) {
    await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [user.id, role_id]);
  }

  return user;
};

export const updateUser = async (id: string, userData: any) => {
  const { name, email, password, status, phone_number, last_login_date, profile_picture_url, role_id, tenant_id } = userData;
  let hashedPassword = password;
  if (password) {
    hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  }

  const { rows } = await pool.query(
    'UPDATE users SET name = $1, email = $2, password = $3, status = $4, phone_number = $5, last_login_date = $6, profile_picture_url = $7, tenant_id = $8 WHERE id = $9 RETURNING *',
    [name, email, hashedPassword, status, phone_number, last_login_date, profile_picture_url, tenant_id, id]
  );
  const user = rows[0];

  if (role_id) {
    await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
    await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [user.id, role_id]);
  }

  return user;
};

export const deleteUser = async (id: string) => {
  await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
};
