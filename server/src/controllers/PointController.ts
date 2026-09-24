import { Request, Response } from "express"
import knex from "../database/connection"
class PointController {
  async index(req: Request, res: Response) {
    const { city, uf, items } = req.query
    const persedItems = String(items)
      .split(",")
      .map((item) => Number(item.trim()))
    knex("points")
      .join("points_items", "points.id", "points_items.point_id")
      .whereIn("points_items.item_id", persedItems)
      .where({ city: String(city) })
      .where({ uf: String(uf) })
      .distinct()
      .select("points.*")
      .then((result) => {
        return res.json(result)
      })
      .catch((error) => {
        console.log(error)
        return res.json({ error: true })
      })
  }
  async create(req: Request, res: Response) {
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
    const transaction = await knex.transaction()
    transaction("points")
      .insert({
        image:
          "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60",
        name,
        email,
        whatsapp,
        latitude,
        longitude,
        city,
        uf,
      })
      .then((insertedIds) => {
        const point_id = insertedIds[0]
        const pointItems = items.map((item_id: number) => {
          return {
            item_id,
            point_id,
          }
        })
        transaction("points_items")
          .insert(pointItems)
          .then(async (result) => {
            await transaction.commit()
            return res.json(result)
          })
          .catch((error) => {
            console.log(error)
            return res.json({ error: true })
          })
      })
      .catch((error) => {
        console.log(error)
        return res.json({ error: true })
      })
  }
  async show(req: Request, res: Response) {
    const { id } = req.params
    const transaction = await knex.transaction()
    transaction("points")
      .where({ id })
      .first()
      .then((result) => {
        if (result) {
          transaction("items")
            .join("points_items", "items.id", "points_items.item_id")
            .where("points_items.point_id", result.id)
            .select("items.title")
            .then(async (secondResult) => {
              await transaction.commit()
              return res.json({ point: result, pointItems: secondResult })
            })
            .catch((error) => {
              console.log(error)
              return res.json({ error: true })
            })
        } else {
          return res.json({ response: "Registro não encontrado" })
        }
      })
      .catch((error) => {
        console.log(error)
        return res.status(400).json({ error: true })
      })
  }
}
export default PointController
