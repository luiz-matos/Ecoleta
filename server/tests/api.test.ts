import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { AddressInfo } from "net"
import { Server } from "http"
import fs from "fs"
import path from "path"

import app from "../src/app"
import knex from "../src/database/connection"
import * as createPoints from "../src/database/migrations/00_create_points"
import * as createItems from "../src/database/migrations/01_create_items"
import * as createPointsItems from "../src/database/migrations/02_create_points_items"
import { seed } from "../src/database/seeds/default_items"

// DATABASE_FILE vem do vitest.config.ts
const databaseFile = process.env.DATABASE_FILE!
const migrations = [createPoints, createItems, createPointsItems]

const uploadsDir = path.resolve(__dirname, "..", "uploads", "points")
// PNG de 1x1 pixel
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
)

let server: Server
let baseUrl: string
const createdImages: string[] = []

const validPoint = {
  name: "Mercado Teste",
  email: "mercado@exemplo.com",
  whatsapp: "61999999999",
  latitude: "-15.8325",
  longitude: "-48.0490",
  city: "Brasília",
  uf: "DF",
  items: "1,2",
}

function pointForm(
  fields: Record<string, string> = validPoint,
  image: Blob | null = new Blob([PNG], { type: "image/png" }),
  fileName = "foto.png"
) {
  const form = new FormData()
  Object.entries(fields).forEach(([key, value]) => form.append(key, value))
  if (image) form.append("image", image, fileName)
  return form
}

async function createPoint(form = pointForm()) {
  const response = await fetch(`${baseUrl}/points`, {
    method: "POST",
    body: form,
  })
  const body = await response.json()
  if (response.status === 201) createdImages.push(body.image)
  return { status: response.status, body }
}

const countUploads = () =>
  fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).length : 0

async function expectServerResponds() {
  const response = await fetch(`${baseUrl}/items`, {
    signal: AbortSignal.timeout(3000),
  })
  expect(response.status).toBe(200)
}

beforeAll(async () => {
  for (const migration of migrations) await migration.up(knex)
  await seed(knex)
  server = app.listen(0)
  const { port } = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${port}`
})

afterAll(async () => {
  server.close()
  await knex.destroy()
  fs.rmSync(databaseFile, { force: true })
  createdImages.forEach((image) =>
    fs.rmSync(path.join(uploadsDir, image), { force: true })
  )
})

describe("GET /items", () => {
  test("lista os 6 itens com a URL do ícone pelo host da requisição", async () => {
    const response = await fetch(`${baseUrl}/items`)
    const items = await response.json()
    expect(items).toHaveLength(6)
    expect(items[0]).toEqual({
      id: 1,
      title: "Lâmpadas",
      image_url: `${baseUrl}/uploads/lampadas.svg`,
    })
  })

  test("rodar o seed de novo não duplica os itens", async () => {
    await seed(knex)
    const [{ total }] = await knex("items").count({ total: "*" })
    expect(Number(total)).toBe(6)
  })
})

describe("POST /points", () => {
  test("cadastra o ponto com a imagem", async () => {
    const before = countUploads()
    const { status, body } = await createPoint()
    expect(status).toBe(201)
    expect(body).toMatchObject({
      name: "Mercado Teste",
      latitude: -15.8325,
      longitude: -48.049,
      city: "Brasília",
      uf: "DF",
    })
    expect(body.image_url).toBe(`${baseUrl}/uploads/points/${body.image}`)
    expect(countUploads()).toBe(before + 1)

    const image = await fetch(body.image_url)
    expect(image.status).toBe(200)
    expect(image.headers.get("content-type")).toBe("image/png")
  })

  test("grava coordenadas como número e cidade como texto", async () => {
    const [types] = await knex("points").select(
      knex.raw("typeof(latitude) as latitude"),
      knex.raw("typeof(longitude) as longitude"),
      knex.raw("typeof(city) as city")
    )
    expect(types).toEqual({ latitude: "real", longitude: "real", city: "text" })
  })

  test("recusa dados inválidos com a lista de erros", async () => {
    const { status, body } = await createPoint(
      pointForm({ ...validPoint, name: "", uf: "0", items: "" })
    )
    expect(status).toBe(400)
    expect(body.details).toEqual([
      "name é obrigatório",
      "uf deve ter duas letras maiúsculas",
      "items deve ter ao menos um item",
    ])
  })

  test("recusa item inexistente", async () => {
    const { status, body } = await createPoint(
      pointForm({ ...validPoint, items: "99" })
    )
    expect(status).toBe(400)
    expect(body.details).toEqual(["items contém item inexistente"])
  })

  test("recusa cadastro sem imagem", async () => {
    const { status, body } = await createPoint(pointForm(validPoint, null))
    expect(status).toBe(400)
    expect(body.details).toEqual(["image é obrigatória"])
  })

  test("recusa arquivo que não é imagem", async () => {
    const text = new Blob(["oi"], { type: "text/plain" })
    const { status, body } = await createPoint(
      pointForm(validPoint, text, "a.txt")
    )
    expect(status).toBe(400)
    expect(body.error).toBe("A imagem deve ser JPG, PNG ou WebP")
  })

  test("recusa imagem maior que 5 MB", async () => {
    const big = new Blob([new Uint8Array(6 * 1024 * 1024)], {
      type: "image/png",
    })
    const { status, body } = await createPoint(
      pointForm(validPoint, big, "g.png")
    )
    expect(status).toBe(400)
    expect(body.error).toBe("A imagem deve ter no máximo 5 MB")
  })

  test("apaga a imagem enviada quando o cadastro é recusado", async () => {
    const before = countUploads()
    const { status } = await createPoint(pointForm({ ...validPoint, uf: "x" }))
    expect(status).toBe(400)
    expect(countUploads()).toBe(before)
  })

  test("sem itens responde 400 e o servidor continua respondendo", async () => {
    const { items, ...withoutItems } = validPoint
    const { status } = await createPoint(pointForm(withoutItems))
    expect(status).toBe(400)
    await expectServerResponds()
  })

  test("JSON malformado responde 400 em JSON", async () => {
    const response = await fetch(`${baseUrl}/points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{quebrado",
    })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Requisição inválida" })
  })
})

describe("GET /points", () => {
  test("filtra por UF, cidade e itens", async () => {
    const query = new URLSearchParams({ uf: "DF", city: "Brasília", items: "1" })
    const points = await (await fetch(`${baseUrl}/points?${query}`)).json()
    expect(points.length).toBeGreaterThan(0)
    expect(points[0].image_url).toContain("/uploads/points/")

    const otherItem = await fetch(`${baseUrl}/points?uf=DF&items=5`)
    expect(await otherItem.json()).toEqual([])
  })

  test("sem filtro devolve todos os pontos", async () => {
    const points = await (await fetch(`${baseUrl}/points`)).json()
    expect(points.length).toBeGreaterThan(0)
  })
})

describe("GET /points/:id", () => {
  test("devolve o ponto e os itens", async () => {
    const response = await fetch(`${baseUrl}/points/1`)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.point.name).toBe("Mercado Teste")
    expect(body.pointItems).toEqual([
      { title: "Lâmpadas" },
      { title: "Pilhas e baterias" },
    ])
  })

  test("id inexistente responde 404 e o servidor continua respondendo", async () => {
    const response = await fetch(`${baseUrl}/points/999`)
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: "Ponto não encontrado" })
    await expectServerResponds()
  })
})
