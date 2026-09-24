import {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
} from "react"
import { Link, useNavigate } from "react-router-dom"
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi"
import { MapContainer, TileLayer, Marker } from "react-leaflet"
import { LeafletMouseEvent } from "leaflet"

import api from "../../services/api"
import { fetchCities, fetchUfs, UF } from "../../services/ibge"
import Dropzone from "../../components/Dropzone"
import MapController, { MapView } from "../../components/MapController"
import logo from "../../assets/logo.svg"
import "./styles.css"

interface Item {
  id: number
  title: string
  image_url: string
}

const SUCCESS_SCREEN_MS = 2000

// Centro do Brasil, usado até a geolocalização responder ou quando ela é negada
const DEFAULT_MAP_VIEW: MapView = { center: [-14.235, -51.9253], zoom: 4 }

const CreatePoint = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [ufs, setUfs] = useState<UF[]>([])
  const [selectedUF, setSelectedUF] = useState("0")
  const [cities, setCities] = useState<string[]>([])
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

  useEffect(() => {
    api
      .get<Item[]>("/items")
      .then((response) => setItems(response.data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchUfs().then(setUfs).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedUF === "0") {
      return
    }
    // Descarta a resposta de uma UF que já foi trocada
    let ignore = false
    fetchCities(selectedUF)
      .then((cityNames) => {
        if (!ignore) setCities(cityNames)
      })
      .catch(console.error)
    return () => {
      ignore = true
    }
  }, [selectedUF])

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

  function handleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedUF(event.target.value)
    setSelectedCity("0")
    setCities([])
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedCity(event.target.value)
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

  function handleItemKeyDown(event: KeyboardEvent, id: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleSelectItem(id)
    }
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
    api
      .post("/points", data)
      .then(() => setIsCreated(true))
      .catch((error) => {
        console.error(error)
        setErrorMessage(
          error.response?.data?.error ??
            "Não foi possível cadastrar o ponto. Tente novamente."
        )
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
          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select
                name="uf"
                id="uf"
                onChange={handleSelectUF}
                value={selectedUF}
              >
                <option value="0">Selecione uma UF</option>
                {ufs.map((uf) => (
                  <option value={uf.initials} key={uf.id}>
                    {uf.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                name="city"
                id="city"
                onChange={handleSelectCity}
                value={selectedCity}
              >
                <option value="0">Selecione uma cidade</option>
                {cities.map((city) => (
                  <option value={city} key={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <h2>Itens de coleta</h2>
            <span>Selecione um ou mais itens de coleta</span>
          </legend>
          <ul className="items-grid">
            {items.map((item) => (
              <li
                key={item.id}
                role="checkbox"
                tabIndex={0}
                aria-checked={selectedItems.includes(item.id)}
                onClick={() => handleSelectItem(item.id)}
                onKeyDown={(event) => handleItemKeyDown(event, item.id)}
                className={selectedItems.includes(item.id) ? "selected" : ""}
              >
                <img src={item.image_url} alt="" />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>
        {errorMessage && <p className="form-error">{errorMessage}</p>}
        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  )
}

export default CreatePoint
