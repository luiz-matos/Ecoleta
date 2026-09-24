export interface PointInput {
  name: string
  email: string
  whatsapp: string
  latitude: number
  longitude: number
  city: string
  uf: string
  items: number[]
}

// No envio em multipart os campos chegam como texto
function toNumber(value: unknown) {
  return typeof value === "string" && value.trim() !== ""
    ? Number(value)
    : value
}

function toItems(value: unknown) {
  return typeof value === "string"
    ? value.split(",").map((item) => Number(item.trim()))
    : value
}

function isFilled(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== ""
}

function isCoordinate(value: unknown, limit: number) {
  return (
    typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit
  )
}

function isItemList(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => Number.isInteger(item) && item > 0)
  )
}

export function parsePoint(body: Record<string, unknown>) {
  const { name, email, whatsapp, city, uf } = body
  const latitude = toNumber(body.latitude)
  const longitude = toNumber(body.longitude)
  const items = toItems(body.items)
  const errors: string[] = []

  if (!isFilled(name)) errors.push("name é obrigatório")
  if (!isFilled(email) || !/^\S+@\S+\.\S+$/.test(email))
    errors.push("email inválido")
  if (!isFilled(whatsapp)) errors.push("whatsapp é obrigatório")
  if (!isFilled(city)) errors.push("city é obrigatório")
  if (typeof uf !== "string" || !/^[A-Z]{2}$/.test(uf))
    errors.push("uf deve ter duas letras maiúsculas")
  if (!isCoordinate(latitude, 90) || !isCoordinate(longitude, 180))
    errors.push("latitude e longitude inválidas")
  if (!isItemList(items)) errors.push("items deve ter ao menos um item")

  if (errors.length > 0) {
    return { errors }
  }
  const point = {
    name,
    email,
    whatsapp,
    latitude,
    longitude,
    city,
    uf,
    items: [...new Set(items as number[])],
  } as PointInput
  return { point, errors }
}
