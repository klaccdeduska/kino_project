
import mysql from 'mysql2/promise';
import 'dotenv/config';

export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? '3308'),
  user: process.env.DB_USER ?? 'kino_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'kino',
  waitForConnections: true,
  connectionLimit: 10,
});
