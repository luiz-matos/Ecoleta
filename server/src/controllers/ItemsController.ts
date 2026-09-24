import { Request, Response } from "express"
import knex from "../database/connection"
import uploadsUrl from "../utils/uploadsUrl"

class ItemsController {
  async index(req: Request, res: Response) {
    const items = await knex("items")
    const serializedItems = items.map(({ id, title, image }) => ({
      id,
      title,
      image_url: uploadsUrl(req, image),
    }))
    return res.json(serializedItems)
  }
}

export default ItemsController
