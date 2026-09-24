import { Request, Response } from "express"
import knex from "../database/connection"
class ItemsController {
  async index(req: Request, res: Response) {
    const items = await knex("items")
    const serializedItems = items.map(({ id, title, image }) => {
      return {
        id,
        title,
        image_url: `${req.protocol}://${req.get("host")}/uploads/${image}`,
      }
    })
    return res.json(serializedItems)
  }
}
export default ItemsController
