import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import api from "../../services/api"
import { ITEMS, leaflet } from "../../test/mocks"
import CreatePoint from "."

vi.mock("react-leaflet", async () => (await import("../../test/mocks")).reactLeafletMock)
vi.mock("../../services/ibge", async () => (await import("../../test/mocks")).ibgeMock)
vi.mock("../../services/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }))

const apiGet = vi.mocked(api.get)
const apiPost = vi.mocked(api.post)

beforeEach(() => {
  leaflet.reset()
  apiGet.mockResolvedValue({ data: ITEMS })
  apiPost.mockResolvedValue({ data: {} })
  URL.createObjectURL = vi.fn(() => "blob:preview")
  URL.revokeObjectURL = vi.fn()
  // Geolocalização negada
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (_success: unknown, error?: (e: unknown) => void) =>
        error?.({ code: 1 }),
    },
  })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

async function renderPage() {
  render(
    <MemoryRouter initialEntries={["/create-point"]}>
      <Routes>
        <Route path="/" element={<p>Página inicial</p>} />
        <Route path="/create-point" element={<CreatePoint />} />
      </Routes>
    </MemoryRouter>
  )
  await screen.findByRole("option", { name: "Goiás" })
}

const field = (id: string) => document.getElementById(id) as HTMLInputElement

async function fillForm({ withImage = true } = {}) {
  if (withImage) {
    const image = new File(["png"], "foto.png", { type: "image/png" })
    const input = document.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [image] } })
  }
  fireEvent.change(field("name"), { target: { name: "name", value: "Mercado" } })
  fireEvent.change(field("email"), { target: { name: "email", value: "m@x.com" } })
  fireEvent.change(field("whatsapp"), {
    target: { name: "whatsapp", value: "61999999999" },
  })
  fireEvent.change(field("uf"), { target: { value: "DF" } })
  await screen.findByRole("option", { name: "Brasília" })
  fireEvent.change(field("city"), { target: { value: "Brasília" } })
  act(() => leaflet.click?.({ latlng: { lat: -15.8, lng: -47.9 } }))
  fireEvent.click(screen.getByRole("checkbox", { name: "Lâmpadas" }))
}

const submit = () => fireEvent.submit(document.querySelector("form")!)
const errorMessage = () => document.querySelector(".form-error")?.textContent

describe("CreatePoint", () => {
  test("envia o cadastro com a imagem e volta para a home", async () => {
    await renderPage()
    await fillForm()
    submit()

    await screen.findByText("Cadastro concluído!")
    const data = apiPost.mock.calls[0][1] as FormData
    expect(Object.fromEntries(data.entries())).toMatchObject({
      name: "Mercado",
      email: "m@x.com",
      whatsapp: "61999999999",
      uf: "DF",
      city: "Brasília",
      latitude: "-15.8",
      longitude: "-47.9",
      items: "1",
    })
    expect((data.get("image") as File).name).toBe("foto.png")
    await screen.findByText("Página inicial", undefined, { timeout: 3000 })
  })

  test("não envia o formulário vazio", async () => {
    await renderPage()
    submit()
    expect(errorMessage()).toBe("Envie uma imagem do ponto de coleta.")
    expect(apiPost).not.toHaveBeenCalled()
  })

  test("trocar a UF limpa a cidade", async () => {
    await renderPage()
    await fillForm()
    fireEvent.change(field("uf"), { target: { value: "GO" } })
    await screen.findByRole("option", { name: "Goiânia" })
    submit()
    expect(field("city").value).toBe("0")
    expect(errorMessage()).toBe("Selecione a cidade.")
    expect(apiPost).not.toHaveBeenCalled()
  })

  test("mostra a mensagem de erro do servidor", async () => {
    apiPost.mockRejectedValue({
      response: { data: { error: "A imagem deve ter no máximo 5 MB" } },
    })
    await renderPage()
    await fillForm()
    submit()
    await vi.waitFor(() =>
      expect(errorMessage()).toBe("A imagem deve ter no máximo 5 MB")
    )
  })

  test("envia uma vez só com clique duplo", async () => {
    apiPost.mockReturnValue(new Promise(() => {}))
    await renderPage()
    await fillForm()
    submit()
    submit()
    expect(apiPost).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Cadastrando..." })).toHaveProperty(
      "disabled",
      true
    )
  })

  test("sem geolocalização, abre no centro do Brasil e sem marcador", async () => {
    await renderPage()
    expect(leaflet.mapCenters[0]).toEqual([-14.235, -51.9253])
    expect(leaflet.markers).toEqual([])
  })

  test("avisa quando os itens não carregam", async () => {
    apiGet.mockRejectedValue(new Error("Network Error"))
    await renderPage()
    await screen.findByText(/Não foi possível carregar os itens de coleta/)
  })

  test("seleciona itens pelo teclado", async () => {
    await renderPage()
    const item = await screen.findByRole("checkbox", { name: "Lâmpadas" })
    fireEvent.keyDown(item, { key: " " })
    expect(item.getAttribute("aria-checked")).toBe("true")
    fireEvent.keyDown(item, { key: "Enter" })
    expect(item.getAttribute("aria-checked")).toBe("false")
  })
})
