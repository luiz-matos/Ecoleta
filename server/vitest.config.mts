import { defineConfig } from "vitest/config"
import os from "os"
import path from "path"

export default defineConfig({
  test: {
    // Banco temporário, criado e apagado pelos testes
    env: {
      DATABASE_FILE: path.join(os.tmpdir(), `ecoleta-test-${process.pid}.sqlite`),
    },
  },
})
