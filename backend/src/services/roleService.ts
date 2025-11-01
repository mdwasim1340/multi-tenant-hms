import { db } from '../database';

const ALLOWED_SORT_FIELDS = ['name', 'description', 'created_at'];
const ALLOWED_ORDER_DIRECTIONS = ['asc', 'desc'];

export const getRoles = async (queryParams: any) => {
  const { page = 1, limit = 10, sortBy = 'created_at', order = 'desc', ...filters } = queryParams;
  const offset = (page - 1) * limit;

  if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
    throw new Error(`Invalid sort field: ${sortBy}`);
  }
  if (!ALLOWED_ORDER_DIRECTIONS.includes(order)) {
    throw new Error(`Invalid order direction: ${order}`);
  }

  let query = 'SELECT r.*, COUNT(ur.user_id) as users FROM roles r LEFT JOIN user_roles ur ON r.id = ur.role_id';
  const queryParamsArray: any[] = [];

  if (Object.keys(filters).length > 0) {
    query += ' WHERE ';
    const filterClauses = Object.entries(filters).map(([key, value], index) => {
      queryParamsArray.push(value);
      return `r.${key} = $${index + 1}`;
    });
    query += filterClauses.join(' AND ');
  }

  query += ' GROUP BY r.id';
  query += ` ORDER BY r.${sortBy} ${order} LIMIT $${queryParamsArray.length + 1} OFFSET $${queryParamsArray.length + 2}`;
  queryParamsArray.push(limit, offset);

  const { rows } = await db..query(query, queryParamsArray);
  return rows;
};

export const getRole = async (id: string) => {
  const { rows } = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
  return rows[0];
};

export const createRole = async (roleData: any) => {
  const { name, description } = roleData;
  const { rows } = await db.query(
    'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
    [name, description]
  );
  return rows[0];
};

export const updateRole = async (id: string, roleData: any) => {
  const { name, description } = roleData;
  const { rows } = await db.query(
    'UPDATE roles SET name = $1, description = $2 WHERE id = $3 RETURNING *',
    [name, description, id]
  );
  return rows[0];
};

export const deleteRole = async (id: string) => {
  await db.query('DELETE FROM user_roles WHERE role_id = $1', [id]);
  await db.query('DELETE FROM roles WHERE id = $1', [id]);
};
