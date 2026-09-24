import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { FiArrowLeft, FiMail, FiX } from "react-icons/fi"
import { FaWhatsapp } from "react-icons/fa"
import { MapContainer, TileLayer, Marker } from "react-leaflet"

import api from "../../services/api"
import useItems from "../../hooks/useItems"
import ItemsGrid from "../../components/ItemsGrid"
import LocationSelect from "../../components/LocationSelect"
import MapController from "../../components/MapController"
import { DEFAULT_MAP_VIEW, MapView } from "../../components/MapController/mapView"
import logo from "../../assets/logo.svg"
import "./styles.css"

interface Point {
  id: number
  name: string
  email: string
  whatsapp: string
  latitude: number
  longitude: number
  city: string
  uf: string
  image_url: string
}

interface PointDetail extends Point {
  items: string[]
}

interface PointResponse {
  point: Point
  pointItems: { title: string }[]
}

// Número salvo sem o código do país ganha o 55 do Brasil
function whatsappUrl(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "")
  const number = digits.length <= 11 ? `55${digits}` : digits
  return `https://wa.me/${number}`
}

const SearchPoints = () => {
  const { items, itemsError } = useItems()
  const [selectedUF, setSelectedUF] = useState("0")
  const [selectedCity, setSelectedCity] = useState("0")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [search, setSearch] = useState<{ key: string; points: Point[] }>()
  const [searchError, setSearchError] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<PointDetail | null>(null)

  const isLocationSelected = selectedUF !== "0" && selectedCity !== "0"
  const searchKey = [selectedUF, selectedCity, ...selectedItems].join("|")
  // Resultado de outra combinação de filtros não aparece enquanto a nova carrega
  const points = search?.key === searchKey ? search.points : null

  useEffect(() => {
    if (!isLocationSelected) {
      return
    }
    let ignore = false
    const params = {
      uf: selectedUF,
      city: selectedCity,
      items: selectedItems.length > 0 ? selectedItems.join(",") : undefined,
    }
    api
      .get<Point[]>("/points", { params })
      .then((response) => {
        if (ignore) return
        setSearch({ key: searchKey, points: response.data })
        setSearchError(false)
      })
      .catch((error) => {
        console.error(error)
        if (!ignore) setSearchError(true)
      })
    return () => {
      ignore = true
    }
  }, [isLocationSelected, selectedUF, selectedCity, selectedItems, searchKey])

  const mapView = useMemo<MapView>(() => {
    if (!points || points.length === 0) return DEFAULT_MAP_VIEW
    return { center: [points[0].latitude, points[0].longitude], zoom: 13 }
  }, [points])

  function handleSelectLocation(uf: string, city: string) {
    setSelectedUF(uf)
    setSelectedCity(city)
    setSelectedPoint(null)
    setSearchError(false)
  }

  function handleSelectItem(id: number) {
    setSelectedItems((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
    setSelectedPoint(null)
    setSearchError(false)
  }

  function handleSelectPoint(id: number) {
    api
      .get<PointResponse>(`/points/${id}`)
      .then((response) => {
        const { point, pointItems } = response.data
        setSelectedPoint({
          ...point,
          items: pointItems.map((item) => item.title),
        })
      })
      .catch(console.error)
  }

  function renderResults() {
    if (!isLocationSelected) {
      return <p className="status">Escolha a UF e a cidade para ver os pontos.</p>
    }
    if (searchError) {
      return (
        <p className="status error">
          Não foi possível buscar os pontos. Tente novamente.
        </p>
      )
    }
    if (!points) {
      return <p className="status">Buscando pontos...</p>
    }
    if (points.length === 0) {
      return <p className="status">Nenhum ponto encontrado com esses filtros.</p>
    }
    return (
      <ul className="points-list">
        {points.map((point) => (
          <li key={point.id}>
            <button type="button" onClick={() => handleSelectPoint(point.id)}>
              <img src={point.image_url} alt="" />
              <strong>{point.name}</strong>
              <span>
                {point.city}, {point.uf}
              </span>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div id="page-search-points">
      <header>
        <img src={logo} alt="Ecoleta" />
        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>
      <main>
        <h1>Pontos de coleta</h1>
        <section className="filters">
          <LocationSelect
            uf={selectedUF}
            city={selectedCity}
            onChange={handleSelectLocation}
          />
          <h2>Itens coletados</h2>
          <p className="hint">Sem item marcado, aparecem todos os pontos.</p>
          {itemsError && (
            <p className="status error">
              Não foi possível carregar os itens de coleta. Recarregue a
              página.
            </p>
          )}
          <ItemsGrid
            items={items}
            selectedItems={selectedItems}
            onToggle={handleSelectItem}
          />
        </section>
        <section className="results">
          <MapContainer center={mapView.center} zoom={mapView.zoom}>
            <MapController view={mapView} />
            <TileLayer
              attribution='&amp;copy <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points?.map((point) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                title={point.name}
                eventHandlers={{ click: () => handleSelectPoint(point.id) }}
              />
            ))}
          </MapContainer>
          {selectedPoint && (
            <article className="point-detail">
              <button
                type="button"
                className="close"
                aria-label="Fechar detalhes"
                onClick={() => setSelectedPoint(null)}
              >
                <FiX />
              </button>
              <img src={selectedPoint.image_url} alt={selectedPoint.name} />
              <div>
                <h2>{selectedPoint.name}</h2>
                <p className="point-items">{selectedPoint.items.join(", ")}</p>
                <p>
                  {selectedPoint.city}, {selectedPoint.uf}
                </p>
                <div className="contacts">
                  <a
                    href={whatsappUrl(selectedPoint.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaWhatsapp />
                    WhatsApp
                  </a>
                  <a href={`mailto:${selectedPoint.email}`}>
                    <FiMail />
                    E-mail
                  </a>
                </div>
              </div>
            </article>
          )}
          {renderResults()}
        </section>
      </main>
    </div>
  )
}

export default SearchPoints
