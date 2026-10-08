import mysql from 'mysql2/promise';

const dbConfig = {
  host: '192.168.31.236',
  // host:'localhost',
  user: 'crackers_v1',
  password: 'crackers_v1',
  database: 'crackers_v1',
// user: 'mzljrmfz_final_v2',
// password: 'mzljrmfz_final_v2',
// database: 'mzljrmfz_final_v2',
};

export const emailConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  user: 'paradisecrackerssales@gmail.com',
  password: process.env.SMTP_PASSWORD || '',
  from: 'paradisecrackerssales@gmail.com',
};

const poolKey = Symbol.for('paradise-crackers.db-pool');

export async function getConnection() {
  const connection = await getPool().getConnection();
  const release = connection.release.bind(connection);
  connection.end = async () => release();
  return connection;
}

export function getPool() {
  if (!globalThis[poolKey]) {
    globalThis[poolKey] = mysql.createPool({
      ...dbConfig,
      connectionLimit: 5,
      waitForConnections: true,
    });
  }

  return globalThis[poolKey];
}
