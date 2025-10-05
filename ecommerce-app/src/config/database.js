// PSEUDO: Database connection and prepared statements usage
import mysql from 'mysql2/promise'

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'ecommerce',
  DB_CONN_LIMIT = 10
} = process.env

export const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(DB_CONN_LIMIT),
  multipleStatements: false,
  namedPlaceholders: false
})

export async function query (sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

export async function getConnection () {
  return pool.getConnection()
}
