import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { AxiosRequestConfig } from "axios"

import api from "../../services/api"
import { ITEMS, leaflet } from "../../test/mocks"
import SearchPoints from "."

vi.mock("react-leaflet", async () => (await import("../../test/mocks")).reactLeafletMock)
vi.mock("../../services/ibge", async () => (await import("../../test/mocks")).ibgeMock)
vi.mock("../../services/api", () => ({ default: { get: vi.fn() } }))

const apiGet = vi.mocked(api.get)

const POINTS = [
  {
    id: 1,
    name: "Mercado A",
    email: "a@x.com",
    whatsapp: "(61) 99999-0000",
    latitude: -15.8,
    longitude: -47.9,
    city: "Brasília",
    uf: "DF",
    image_url: "a.png",
  },
  {
    id: 2,
    name: "Mercado B",
    email: "b@x.com",
    whatsapp: "5561988887777",
    latitude: -15.7,
    longitude: -47.8,
    city: "Brasília",
    uf: "DF",
    image_url: "b.png",
  },
]

function mockApi({ failSearch = false } = {}) {
  apiGet.mockImplementation(async (url: string, config?: AxiosRequestConfig) => {
    if (url === "/items") return { data: ITEMS }
    if (url === "/points") {
      if (failSearch) throw new Error("500")
      return { data: config?.params.items === "2" ? [] : POINTS }
    }
    if (url === "/points/1") {
      return {
        data: {
          point: POINTS[0],
          pointItems: [{ title: "Lâmpadas" }, { title: "Óleo de Cozinha" }],
        },
      }
    }
    throw new Error(`URL inesperada: ${url}`)
  })
}

beforeEach(() => {
  leaflet.reset()
  mockApi()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const field = (id: string) => document.getElementById(id) as HTMLSelectElement
const status = () => document.querySelector(".status")?.textContent
const pointSearches = () => apiGet.mock.calls.filter(([url]) => url === "/points")

async function renderAndChooseCity() {
  render(
    <MemoryRouter>
      <SearchPoints />
    </MemoryRouter>
  )
  await screen.findByRole("option", { name: "Goiás" })
  expect(status()).toBe("Escolha a UF e a cidade para ver os pontos.")
  fireEvent.change(field("uf"), { target: { value: "DF" } })
  await screen.findByRole("option", { name: "Brasília" })
  expect(pointSearches()).toHaveLength(0)
  fireEvent.change(field("city"), { target: { value: "Brasília" } })
}

describe("SearchPoints", () => {
  test("busca os pontos da cidade e mostra no mapa e na lista", async () => {
    await renderAndChooseCity()
    await screen.findByText("Mercado A")

    expect(pointSearches().at(-1)?.[1]).toEqual({
      params: { uf: "DF", city: "Brasília", items: undefined },
    })
    expect(document.querySelectorAll(".points-list li")).toHaveLength(2)
    expect(leaflet.markers.slice(-2).map((marker) => marker.title)).toEqual([
      "Mercado A",
      "Mercado B",
    ])
    expect(leaflet.fitBoundsCalls.at(-1)?.[0]).toEqual([
      [-15.8, -47.9],
      [-15.7, -47.8],
    ])
  })

  test("filtra por item e avisa quando não há resultado", async () => {
    await renderAndChooseCity()
    await screen.findByText("Mercado A")
    fireEvent.click(screen.getByRole("checkbox", { name: "Óleo de Cozinha" }))

    await vi.waitFor(() =>
      expect(status()).toBe("Nenhum ponto encontrado com esses filtros.")
    )
    expect(pointSearches().at(-1)?.[1]).toEqual({
      params: { uf: "DF", city: "Brasília", items: "2" },
    })
  })

  test("mostra o detalhe do ponto com os contatos", async () => {
    await renderAndChooseCity()
    fireEvent.click(await screen.findByText("Mercado A"))
    await screen.findByText("Lâmpadas, Óleo de Cozinha")

    const links = [...document.querySelectorAll(".contacts a")].map((link) =>
      link.getAttribute("href")
    )
    expect(links).toEqual(["https://wa.me/5561999990000", "mailto:a@x.com"])

    fireEvent.click(screen.getByLabelText("Fechar detalhes"))
    expect(document.querySelector(".point-detail")).toBeNull()
  })

  test("trocar a UF limpa a cidade e os resultados", async () => {
    await renderAndChooseCity()
    await screen.findByText("Mercado A")
    fireEvent.change(field("uf"), { target: { value: "GO" } })

    expect(field("city").value).toBe("0")
    expect(status()).toBe("Escolha a UF e a cidade para ver os pontos.")
    expect(document.querySelectorAll(".points-list li")).toHaveLength(0)
  })

  test("avisa quando a busca falha", async () => {
    mockApi({ failSearch: true })
    await renderAndChooseCity()
    await vi.waitFor(() =>
      expect(status()).toBe("Não foi possível buscar os pontos. Tente novamente.")
    )
  })
})
