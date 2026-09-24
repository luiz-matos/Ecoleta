import { useEffect, useState, ChangeEvent, FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import { LeafletMouseEvent } from "leaflet"

import axios from "axios"
import api from "../../services/api"
import Dropzone from "../../components/Dropzone"
import logo from "../../assets/logo.svg"
import "./style.css"

interface Item {
  id: number
  title: string
  image_url: string
}

interface UF {
  id: number
  uf: string
  name: string
}

interface IBGEUF {
  id: number
  nome: string
  sigla: string
}
interface IBGECity {
  nome: string
}

interface MapView {
  center: [number, number]
  zoom: number
}

const SUCCESS_SCREEN_MS = 2000

// Centro do Brasil, usado até a geolocalização responder ou quando ela é negada
const DEFAULT_MAP_VIEW: MapView = { center: [-14.235, -51.9253], zoom: 4 }

interface MapControllerProps {
  view: MapView
  onClick: (event: LeafletMouseEvent) => void
}

const MapController = ({ view, onClick }: MapControllerProps) => {
  const map = useMapEvents({ click: onClick })
  useEffect(() => {
    map.setView(view.center, view.zoom)
  }, [map, view])
  return null
}

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
  const [formData, setFormData] = useState({
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
      .get("/items")
      .then((response) => {
        setItems(response.data)
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  useEffect(() => {
    axios
      .get<IBGEUF[]>(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
      )
      .then((response) => {
        const ufInitials = response.data.map((initial) => {
          return {
            id: initial.id,
            name: initial.nome,
            uf: initial.sigla,
          }
        })
        setUfs(ufInitials)
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  useEffect(() => {
    if (selectedUF === "0") {
      return
    }
    let ignore = false
    axios
      .get<IBGECity[]>(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios?orderBy=nome`
      )
      .then((response) => {
        if (ignore) return
        const cityNames = response.data.map((city) => city.nome)
        setCities(cityNames)
      })
      .catch((error) => {
        console.log(error)
      })
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

  function hundleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedUF(event.target.value)
    setSelectedCity("0")
    setCities([])
  }

  function hundleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedCity(event.target.value)
  }

  function hundleMapClick(event: LeafletMouseEvent) {
    const { lat, lng } = event.latlng
    setSelectedPosition([lat, lng])
  }

  function hundleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { value, name } = event.target
    setFormData({ ...formData, [name]: value })
  }

  function hundleSelectItem(id: number) {
    const alreadySelected = selectedItems.findIndex((item) => item === id)
    if (alreadySelected >= 0) {
      const filteredItems = selectedItems.filter((item) => item !== id)
      setSelectedItems(filteredItems)
    } else {
      setSelectedItems([...selectedItems, id])
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

  function hundleSubmit(event: FormEvent) {
    event.preventDefault()
    const validationError = validateForm()
    setErrorMessage(validationError)
    if (validationError || !selectedPosition || !selectedFile) {
      return
    }
    const { name, email, whatsapp } = formData
    const uf = selectedUF
    const city = selectedCity
    const [latitude, longitude] = selectedPosition
    const items = selectedItems
    const data = new FormData()
    data.append("name", name)
    data.append("email", email)
    data.append("whatsapp", whatsapp)
    data.append("uf", uf)
    data.append("city", city)
    data.append("latitude", String(latitude))
    data.append("longitude", String(longitude))
    data.append("items", items.join(","))
    data.append("image", selectedFile)
    api
      .post("/points", data)
      .then(() => {
        setIsCreated(true)
      })
      .catch((error) => {
        console.log(error)
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
      <form onSubmit={hundleSubmit}>
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
              onChange={hundleInputChange}
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
                onChange={hundleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                required
                onChange={hundleInputChange}
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
            <MapController view={mapView} onClick={hundleMapClick} />
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
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
                onChange={hundleSelectUF}
                value={selectedUF}
              >
                <option value="0">Selecione uma UF</option>
                {ufs.map((uf) => (
                  <option value={uf.uf} key={uf.id}>
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
                onChange={hundleSelectCity}
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
            <h2>Ítens de coleta</h2>
            <span>Selecione um ou mais ítens de coleta</span>
          </legend>
          <ul className="items-grid">
            {items.map((item) => (
              <li
                key={item.id}
                onClick={() => hundleSelectItem(item.id)}
                className={selectedItems.includes(item.id) ? "selected" : ""}
              >
                <img src={item.image_url} alt={item.title} />
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
