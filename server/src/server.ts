import express, { NextFunction, Request, Response } from "express"
import cors from "cors"
import routes from "./routes"
import path from "path"
const app = express()
app.use(cors())
app.use(express.json())
app.use(routes)
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")))

app.use(
  (
    error: Error & { status?: number },
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (error.status && error.status < 500) {
      return res.status(error.status).json({ error: "Requisição inválida" })
    }
    console.error(error)
    return res.status(500).json({ error: "Erro interno do servidor" })
  }
)

app.listen(Number(process.env.PORT) || 3333)
