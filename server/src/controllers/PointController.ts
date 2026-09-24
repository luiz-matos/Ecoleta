import { Request, Response } from "express"
import fs from "fs"
import knex from "../database/connection"
import uploadsUrl from "../utils/uploadsUrl"

// No envio em multipart os campos chegam como texto
function parsePointBody(body: Record<string, unknown>) {
  const toNumber = (value: unknown) =>
    typeof value === "string" && value.trim() !== "" ? Number(value) : value
  return {
    ...body,
    latitude: toNumber(body.latitude),
    longitude: toNumber(body.longitude),
    items:
      typeof body.items === "string"
        ? body.items.split(",").map((item) => Number(item.trim()))
        : body.items,
  }
}

function serializePoint<T extends { image: string }>(req: Request, point: T) {
  return { ...point, image_url: uploadsUrl(req, `points/${point.image}`) }
}

function removeUploadedFile(req: Request) {
  if (req.file) {
    fs.promises.unlink(req.file.path).catch(() => {})
  }
}

function validatePoint(body: Record<string, unknown>) {
  const errors: string[] = []
  const { name, email, whatsapp, latitude, longitude, city, uf, items } = body
  const isFilled = (value: unknown) =>
    typeof value === "string" && value.trim() !== ""

  if (!isFilled(name)) errors.push("name é obrigatório")
  if (!isFilled(email) || !/^\S+@\S+\.\S+$/.test(String(email)))
    errors.push("email inválido")
  if (!isFilled(whatsapp)) errors.push("whatsapp é obrigatório")
  if (!isFilled(city)) errors.push("city é obrigatório")
  if (typeof uf !== "string" || !/^[A-Z]{2}$/.test(uf))
    errors.push("uf deve ter duas letras maiúsculas")
  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  )
    errors.push("latitude e longitude inválidas")
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    !items.every((item) => Number.isInteger(item) && item > 0)
  )
    errors.push("items deve ter ao menos um item")
  return errors
}

class PointController {
  async index(req: Request, res: Response) {
    const { city, uf, items } = req.query
    const query = knex("points")
      .join("points_items", "points.id", "points_items.point_id")
      .distinct()
      .select("points.*")
    if (items) {
      const persedItems = String(items)
        .split(",")
        .map((item) => Number(item.trim()))
      query.whereIn("points_items.item_id", persedItems)
    }
    if (city) query.where({ city: String(city) })
    if (uf) query.where({ uf: String(uf) })
    const points = await query
    return res.json(points.map((point) => serializePoint(req, point)))
  }
  async create(req: Request, res: Response) {
    const body = parsePointBody(req.body ?? {})
    const errors = validatePoint(body)
    if (!req.file) errors.push("image é obrigatória")
    if (errors.length === 0) {
      const existingItems = await knex("items").whereIn(
        "id",
        body.items as number[]
      )
      if (existingItems.length !== new Set(body.items as number[]).size) {
        errors.push("items contém item inexistente")
      }
    }
    if (errors.length > 0) {
      removeUploadedFile(req)
      return res.status(400).json({ error: "Dados inválidos", details: errors })
    }
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items,
    } = body as Record<string, any>
    const point = {
      image: req.file!.filename,
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    }
    let id: number
    try {
      id = await knex.transaction(async (transaction) => {
        const [point_id] = await transaction("points").insert(point)
        const pointItems = [...new Set<number>(items)].map((item_id) => {
          return {
            item_id,
            point_id,
          }
        })
        await transaction("points_items").insert(pointItems)
        return point_id
      })
    } catch (error) {
      removeUploadedFile(req)
      throw error
    }
    return res.status(201).json(serializePoint(req, { id, ...point }))
  }
  async show(req: Request, res: Response) {
    const { id } = req.params
    const point = await knex("points").where({ id }).first()
    if (!point) {
      return res.status(404).json({ error: "Ponto não encontrado" })
    }
    const pointItems = await knex("items")
      .join("points_items", "items.id", "points_items.item_id")
      .where("points_items.point_id", point.id)
      .select("items.title")
    return res.json({ point: serializePoint(req, point), pointItems })
  }
}
export default PointController
