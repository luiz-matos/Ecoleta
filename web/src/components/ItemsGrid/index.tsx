import { KeyboardEvent } from "react"
import { Item } from "../../hooks/useItems"

import "./styles.css"

interface ItemsGridProps {
  items: Item[]
  selectedItems: number[]
  onToggle: (id: number) => void
}

// Grade de itens de coleta, cada um um checkbox acessível pelo teclado
const ItemsGrid = ({ items, selectedItems, onToggle }: ItemsGridProps) => {
  function handleKeyDown(event: KeyboardEvent, id: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onToggle(id)
    }
  }

  return (
    <ul className="items-grid">
      {items.map((item) => (
        <li
          key={item.id}
          role="checkbox"
          tabIndex={0}
          aria-checked={selectedItems.includes(item.id)}
          onClick={() => onToggle(item.id)}
          onKeyDown={(event) => handleKeyDown(event, item.id)}
          className={selectedItems.includes(item.id) ? "selected" : ""}
        >
          <img src={item.image_url} alt="" />
          <span>{item.title}</span>
        </li>
      ))}
    </ul>
  )
}

export default ItemsGrid
