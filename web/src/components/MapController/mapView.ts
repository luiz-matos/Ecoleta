export interface MapView {
  center: [number, number]
  zoom: number
  // Com bounds, o mapa enquadra todos esses pontos no lugar de center e zoom
  bounds?: [number, number][]
}

// Centro do Brasil, usado quando ainda não há posição para mostrar
export const DEFAULT_MAP_VIEW: MapView = {
  center: [-14.235, -51.9253],
  zoom: 4,
}
