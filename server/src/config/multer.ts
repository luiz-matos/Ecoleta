import multer from "multer"
import path from "path"
import crypto from "crypto"
import HttpError from "../errors/HttpError"

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
}

export const MAX_IMAGE_SIZE_MB = 5

export default multer({
  storage: multer.diskStorage({
    destination: path.resolve(__dirname, "..", "..", "uploads", "points"),
    filename(req, file, callback) {
      callback(null, `${crypto.randomUUID()}${EXTENSIONS[file.mimetype]}`)
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (file.mimetype in EXTENSIONS) {
      return callback(null, true)
    }
    callback(new HttpError(400, "A imagem deve ser JPG, PNG ou WebP"))
  },
})
