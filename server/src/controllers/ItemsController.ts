import { Request, Response } from "express"
import knex from "../database/connection"
class ItemsController {
  index(req: Request, res: Response) {
    knex("items")
      .then((result) => {
        const serializedItems = result.map(({ id, title, image }) => {
          return {
            id,
            title,
            image_url: `http://127.0.0.1:3333/uploads/${image}`,
          }
        })
        return res.json(serializedItems)
      })
      .catch((error) => {
        console.log(error)
        return res.json({ error: true })
      })
  }
}
export default ItemsController
