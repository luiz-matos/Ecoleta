import { useEffect, useState, ChangeEvent, FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi"
import { MapContainer, TileLayer, Marker } from "react-leaflet"
import { LeafletMouseEvent } from "leaflet"

import api from "../../services/api"
import useItems from "../../hooks/useItems"
import Dropzone from "../../components/Dropzone"
import ItemsGrid from "../../components/ItemsGrid"
import LocationSelect from "../../components/LocationSelect"
import MapController from "../../components/MapController"
import { DEFAULT_MAP_VIEW, MapView } from "../../components/MapController/mapView"
import logo from "../../assets/logo.svg"
import "./styles.css"

const SUCCESS_SCREEN_MS = 2000

const CreatePoint = () => {
  const navigate = useNavigate()
  const { items, itemsError } = useItems()
  const [selectedUF, setSelectedUF] = useState("0")
  const [selectedCity, setSelectedCity] = useState("0")
  const [selectedPosition, setSelectedPosition] = useState<
    [number, number] | null
  >(null)
  const [mapView, setMapView] = useState<MapView>(DEFAULT_MAP_VIEW)
  const [formFields, setFormFields] = useState({
    name: "",
    email: "",
    whatsapp: "",
  })
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [selectedFile, setSelectedFile] = useState<File>()
  const [errorMessage, setErrorMessage] = useState("")
  const [isCreated, setIsCreated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords
      setMapView({ center: [latitude, longitude], zoom: 15 })
    })
  }, [])

  useEffect(() => {
    if (!isCreated) {
      return
    }
    const timeout = setTimeout(() => navigate("/"), SUCCESS_SCREEN_MS)
    return () => clearTimeout(timeout)
  }, [isCreated, navigate])

  function handleSelectLocation(uf: string, city: string) {
    setSelectedUF(uf)
    setSelectedCity(city)
  }

  function handleMapClick(event: LeafletMouseEvent) {
    const { lat, lng } = event.latlng
    setSelectedPosition([lat, lng])
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { value, name } = event.target
    setFormFields((current) => ({ ...current, [name]: value }))
  }

  function handleSelectItem(id: number) {
    setSelectedItems((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  function validateForm() {
    if (!selectedFile) return "Envie uma imagem do ponto de coleta."
    if (selectedUF === "0") return "Selecione o estado."
    if (selectedCity === "0") return "Selecione a cidade."
    if (!selectedPosition) return "Marque o endereço no mapa."
    if (selectedItems.length === 0)
      return "Selecione ao menos um item de coleta."
    return ""
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isSubmitting) {
      return
    }
    const validationError = validateForm()
    setErrorMessage(validationError)
    if (validationError || !selectedPosition || !selectedFile) {
      return
    }
    const [latitude, longitude] = selectedPosition
    const fields = {
      ...formFields,
      uf: selectedUF,
      city: selectedCity,
      latitude: String(latitude),
      longitude: String(longitude),
      items: selectedItems.join(","),
    }
    const data = new FormData()
    Object.entries(fields).forEach(([key, value]) => data.append(key, value))
    data.append("image", selectedFile)
    setIsSubmitting(true)
    api
      .post("/points", data)
      .then(() => setIsCreated(true))
      .catch((error) => {
        console.error(error)
        setErrorMessage(
          error.response?.data?.error ??
            "Não foi possível cadastrar o ponto. Tente novamente."
        )
        setIsSubmitting(false)
      })
  }

  return (
    <div id="page-create-point">
      {isCreated && (
        <div className="success-screen" role="status">
          <FiCheckCircle />
          <strong>Cadastro concluído!</strong>
        </div>
      )}
      <header>
        <img src={logo} alt="Ecoleta" />
        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>
      <form onSubmit={handleSubmit}>
        <h1>
          Cadastro do <br /> ponto de coleta
        </h1>
        <Dropzone onFileSelected={setSelectedFile} />
        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>
          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              required
              onChange={handleInputChange}
            />
          </div>
          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                name="email"
                id="email"
                required
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                required
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>
          <MapContainer center={mapView.center} zoom={mapView.zoom}>
            <MapController view={mapView} onClick={handleMapClick} />
            <TileLayer
              attribution='&amp;copy <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {selectedPosition && <Marker position={selectedPosition} />}
          </MapContainer>
          <LocationSelect
            uf={selectedUF}
            city={selectedCity}
            onChange={handleSelectLocation}
          />
        </fieldset>
        <fieldset>
          <legend>
            <h2>Itens de coleta</h2>
            <span>Selecione um ou mais itens de coleta</span>
          </legend>
          {itemsError && (
            <p className="load-error">
              Não foi possível carregar os itens de coleta. Recarregue a
              página.
            </p>
          )}
          <ItemsGrid
            items={items}
            selectedItems={selectedItems}
            onToggle={handleSelectItem}
          />
        </fieldset>
        {errorMessage && <p className="form-error">{errorMessage}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Cadastrando..." : "Cadastrar ponto de coleta"}
        </button>
      </form>
    </div>
  )
}

export default CreatePoint
