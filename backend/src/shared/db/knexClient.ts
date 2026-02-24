import knex, { Knex } from "knex";

declare global {
  var __knex: Knex | undefined;
}

const createConnection = (): Knex => {
  return knex({
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER ,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false
      }
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