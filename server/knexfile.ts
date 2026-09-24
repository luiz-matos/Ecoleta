import path from "path"
import type { Knex } from "knex"

const config: Knex.Config = {
  client: "sqlite3",
  connection: {
    // Os testes usam um banco temporário
    filename:
      process.env.DATABASE_FILE ||
      path.resolve(__dirname, "src", "database", "database.sqlite"),
  },
  migrations: {
    directory: path.resolve(__dirname, "src", "database", "migrations"),
  },
  seeds: {
    directory: path.resolve(__dirname, "src", "database", "seeds"),
  },
  useNullAsDefault: true,
}

export default config
