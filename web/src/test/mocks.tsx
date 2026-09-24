import { ReactNode } from "react"
import { vi } from "vitest"

// Estado gravado pelos dublês do react-leaflet, lido pelos testes
export const leaflet = {
  mapCenters: [] as unknown[],
  markers: [] as { position: unknown; title?: string }[],
  setViewCalls: [] as unknown[][],
  fitBoundsCalls: [] as unknown[][],
  click: undefined as ((event: unknown) => void) | undefined,
  reset() {
    this.mapCenters = []
    this.markers = []
    this.setViewCalls = []
    this.fitBoundsCalls = []
    this.click = undefined
  },
}

const fakeMap = {
  setView: (...args: unknown[]) => leaflet.setViewCalls.push(args),
  fitBounds: (...args: unknown[]) => leaflet.fitBoundsCalls.push(args),
}

export const reactLeafletMock = {
  MapContainer: (props: { center: unknown; children?: ReactNode }) => {
    leaflet.mapCenters.push(props.center)
    return <div>{props.children}</div>
  },
  TileLayer: () => null,
  Marker: (props: { position: unknown; title?: string }) => {
    leaflet.markers.push({ position: props.position, title: props.title })
    return null
  },
  useMapEvents: (handlers: { click?: (event: unknown) => void }) => {
    leaflet.click = handlers.click
    return fakeMap
  },
}

export const ibgeMock = {
  fetchUfs: vi.fn(async () => [
    { id: 53, name: "Distrito Federal", initials: "DF" },
    { id: 52, name: "Goiás", initials: "GO" },
  ]),
  fetchCities: vi.fn(async (uf: string) =>
    uf === "DF" ? ["Brasília"] : ["Goiânia"]
  ),
}

export const ITEMS = [
  { id: 1, title: "Lâmpadas", image_url: "lampadas.svg" },
  { id: 2, title: "Óleo de Cozinha", image_url: "oleo.svg" },
]
