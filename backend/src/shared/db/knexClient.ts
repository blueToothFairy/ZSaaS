import dotenv from 'dotenv';
dotenv.config();
import knex, { Knex } from "knex";

declare global {
  var __knex: Knex | undefined;
}

const createConnection = (): Knex => {
  const host = process.env.DB_HOST;
  const isLocalDatabase = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  return knex({
    client: "pg",
    connection: {
      host,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER ,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: isLocalDatabase ? false : { rejectUnauthorized: false }
    } as any,
    pool: {
      min: 0,
      max: 10
    }
  });
};

// Singleton
const db = global.__knex ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  global.__knex = db;
}

export default db;
