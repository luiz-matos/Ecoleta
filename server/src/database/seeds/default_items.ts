import { Knex } from "knex"

const DEFAULT_ITEMS = [
  { title: "Lâmpadas", image: "lampadas.svg" },
  { title: "Pilhas e baterias", image: "baterias.svg" },
  { title: "Papéis e Papelão", image: "papeis-papelao.svg" },
  { title: "Resíduos Eletrônicos", image: "eletronicos.svg" },
  { title: "Resíduos Orgânicos", image: "organicos.svg" },
  { title: "Óleo de Cozinha", image: "oleo.svg" },
]

// Insere só os itens que ainda não existem, para o seed poder rodar de novo
export async function seed(knex: Knex) {
  const existingTitles: string[] = await knex("items").pluck("title")
  const missingItems = DEFAULT_ITEMS.filter(
    (item) => !existingTitles.includes(item.title)
  )
  if (missingItems.length > 0) {
    await knex("items").insert(missingItems)
  }
}
