import { useEffect } from "react"
import { useMapEvents } from "react-leaflet"
import { LeafletMouseEvent } from "leaflet"

export interface MapView {
  center: [number, number]
  zoom: number
}

interface MapControllerProps {
  view: MapView
  onClick: (event: LeafletMouseEvent) => void
}

// O MapContainer só usa center e zoom na montagem; este componente
// recentraliza o mapa quando a view muda e repassa o clique
const MapController = ({ view, onClick }: MapControllerProps) => {
  const map = useMapEvents({ click: onClick })
  useEffect(() => {
    map.setView(view.center, view.zoom)
  }, [map, view])
  return null
}

export default MapController
