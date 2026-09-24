export interface MapView {
  center: [number, number]
  zoom: number
}

// Centro do Brasil, usado quando ainda não há posição para mostrar
export const DEFAULT_MAP_VIEW: MapView = {
  center: [-14.235, -51.9253],
  zoom: 4,
}
