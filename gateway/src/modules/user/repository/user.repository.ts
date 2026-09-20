import { pool } from '../../../config/db';
import { User } from '../models/user.model';

// Repository layer: only place in the module allowed to write SQL.
// Services never touch `pool` directly — they call through here.

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: User['role'];
  created_at: Date;
  updated_at: Date;
}

const SELECT_COLUMNS = 'id, name, email, phone, password_hash, role, created_at, updated_at';

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const userRepository = {
  async create(input: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: User['role'];
  }): Promise<User> {
    const { rows } = await pool.query<UserRow>(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${SELECT_COLUMNS}`,
      [input.name, input.email, input.phone, input.passwordHash, input.role]
    );
    return mapRow(rows[0]);
  },

  async findById(id: string): Promise<User | null> {
    const { rows } = await pool.query<UserRow>(`SELECT ${SELECT_COLUMNS} FROM users WHERE id = $1`, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await pool.query<UserRow>(`SELECT ${SELECT_COLUMNS} FROM users WHERE email = $1`, [email]);
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findByPhone(phone: string): Promise<User | null> {
    const { rows } = await pool.query<UserRow>(`SELECT ${SELECT_COLUMNS} FROM users WHERE phone = $1`, [phone]);
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async updateById(id: string, fields: { name?: string; email?: string }): Promise<User | null> {
    const { rows } = await pool.query<UserRow>(
      `UPDATE users SET
         name = COALESCE($2, name),
         email = COALESCE($3, email),
         updated_at = now()
       WHERE id = $1
       RETURNING ${SELECT_COLUMNS}`,
      [id, fields.name ?? null, fields.email ?? null]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },
};
