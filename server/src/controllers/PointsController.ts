import { Request, Response } from "express"
import fs from "fs"
import knex from "../database/connection"
import uploadsUrl from "../utils/uploadsUrl"
import { parsePoint } from "../validations/point"

function serializePoint<T extends { image: string }>(req: Request, point: T) {
  return { ...point, image_url: uploadsUrl(req, `points/${point.image}`) }
}

function removeUploadedFile(req: Request) {
  if (req.file) {
    fs.promises.unlink(req.file.path).catch(() => {})
  }
}

class PointsController {
  async index(req: Request, res: Response) {
    const { city, uf, items } = req.query
    const query = knex("points")
      .join("points_items", "points.id", "points_items.point_id")
      .distinct()
      .select("points.*")
    if (items) {
      const parsedItems = String(items)
        .split(",")
        .map((item) => Number(item.trim()))
      query.whereIn("points_items.item_id", parsedItems)
    }
    if (city) query.where({ city: String(city) })
    if (uf) query.where({ uf: String(uf) })
    const points = await query
    return res.json(points.map((point) => serializePoint(req, point)))
  }

  async create(req: Request, res: Response) {
    const { point: input, errors } = parsePoint(req.body ?? {})
    if (!req.file) errors.push("image é obrigatória")
    if (input && errors.length === 0) {
      const existingItems = await knex("items").whereIn("id", input.items)
      if (existingItems.length !== input.items.length) {
        errors.push("items contém item inexistente")
      }
    }
    if (!input || !req.file || errors.length > 0) {
      removeUploadedFile(req)
      return res.status(400).json({ error: "Dados inválidos", details: errors })
    }

    const { items, ...fields } = input
    const point = { image: req.file.filename, ...fields }
    let id: number
    try {
      id = await knex.transaction(async (transaction) => {
        const [pointId] = await transaction("points").insert(point)
        const pointItems = items.map((itemId) => ({
          item_id: itemId,
          point_id: pointId,
        }))
        await transaction("points_items").insert(pointItems)
        return pointId
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

export default PointsController
