import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';

const driver = (process.env.DB_DRIVER || 'mysql').toLowerCase();
let mysqlPool = null;
let mongoDb = null;

export async function initDb() {
  if (driver === 'mysql') {
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DB || 'alyusr',
      waitForConnections: true,
      connectionLimit: 10,
    });
    await mysqlPool.query('SELECT 1');
    console.log('✅ MySQL connected');
  } else if (driver === 'mongo') {
    const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017');
    await client.connect();
    mongoDb = client.db(process.env.MONGO_DB || 'alyusr');
    console.log('✅ Mongo connected');
  } else {
    throw new Error(`Unknown DB_DRIVER: ${driver}`);
  }
}

export const isMongo = () => driver === 'mongo';
export const sql = () => mysqlPool;
export const mongo = () => mongoDb;