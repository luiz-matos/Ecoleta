import { useEffect } from "react"
import { useMapEvents } from "react-leaflet"
import { LeafletMouseEvent } from "leaflet"
import { MapView } from "./mapView"

interface MapControllerProps {
  view: MapView
  onClick?: (event: LeafletMouseEvent) => void
}

// O MapContainer só usa center e zoom na montagem; este componente
// reposiciona o mapa quando a view muda e repassa o clique
const MapController = ({ view, onClick }: MapControllerProps) => {
  const map = useMapEvents(onClick ? { click: onClick } : {})
  useEffect(() => {
    if (view.bounds) {
      map.fitBounds(view.bounds, { padding: [40, 40] })
    } else {
      map.setView(view.center, view.zoom)
    }
  }, [map, view])
  return null
}

export default MapController
