import { Request, Response } from "express"
import knex from "../database/connection"

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
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
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
    return res.json(points)
  }
  async create(req: Request, res: Response) {
    const errors = validatePoint(req.body ?? {})
    if (errors.length === 0) {
      const existingItems = await knex("items").whereIn("id", req.body.items)
      if (existingItems.length !== new Set(req.body.items).size) {
        errors.push("items contém item inexistente")
      }
    }
    if (errors.length > 0) {
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
    } = req.body
    const point = {
      image:
        "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60",
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    }
    const id = await knex.transaction(async (transaction) => {
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
    return res.status(201).json({ id, ...point })
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
    return res.json({ point, pointItems })
  }
}
export default PointController
