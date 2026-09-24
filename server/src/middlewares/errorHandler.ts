import { NextFunction, Request, Response } from "express"
import multer from "multer"
import HttpError from "../errors/HttpError"
import { MAX_IMAGE_SIZE_MB } from "../config/multer"

// O Express só reconhece o middleware de erro pelos quatro parâmetros
export default function errorHandler(
  error: Error & { status?: number },
  req: Request,
  res: Response,
  next: NextFunction
) {
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
  // Erros do próprio Express, como JSON malformado
  if (error.status && error.status < 500) {
    return res.status(error.status).json({ error: "Requisição inválida" })
  }
  console.error(error)
  return res.status(500).json({ error: "Erro interno do servidor" })
}
