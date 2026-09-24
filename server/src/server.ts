import express, { NextFunction, Request, Response } from "express"
import cors from "cors"
import multer from "multer"
import routes from "./routes"
import path from "path"
import HttpError from "./errors/HttpError"
import { MAX_IMAGE_SIZE_MB } from "./config/multer"
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
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message })
    }
    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? `A imagem deve ter no máximo ${MAX_IMAGE_SIZE_MB} MB`
          : "Envio de arquivo inválido"
      return res.status(400).json({ error: message })
    }
    if (error.status && error.status < 500) {
      return res.status(error.status).json({ error: "Requisição inválida" })
    }
    console.error(error)
    return res.status(500).json({ error: "Erro interno do servidor" })
  }
)

app.listen(Number(process.env.PORT) || 3333)
