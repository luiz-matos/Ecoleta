import { Request } from "express"

// Monta a URL com o endereço pelo qual o servidor foi acessado
export default function uploadsUrl(req: Request, file: string) {
  return `${req.protocol}://${req.get("host")}/uploads/${file}`
}
