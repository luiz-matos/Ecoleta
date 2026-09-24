import { useEffect, useState } from "react"
import api from "../services/api"

export interface Item {
  id: number
  title: string
  image_url: string
}

export default function useItems() {
  const [items, setItems] = useState<Item[]>([])
  const [itemsError, setItemsError] = useState(false)

  useEffect(() => {
    api
      .get<Item[]>("/items")
      .then((response) => setItems(response.data))
      .catch((error) => {
        console.error(error)
        setItemsError(true)
      })
  }, [])

  return { items, itemsError }
}
