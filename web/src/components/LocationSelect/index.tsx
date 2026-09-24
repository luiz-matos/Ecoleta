import useIbgeLocations from "../../hooks/useIbgeLocations"

interface LocationSelectProps {
  uf: string
  city: string
  onChange: (uf: string, city: string) => void
}

// Selects de UF e cidade. Trocar a UF volta a cidade para "Selecione"
const LocationSelect = ({ uf, city, onChange }: LocationSelectProps) => {
  const { ufs, cities } = useIbgeLocations(uf)

  return (
    <div className="field-group">
      <div className="field">
        <label htmlFor="uf">Estado (UF)</label>
        <select
          name="uf"
          id="uf"
          value={uf}
          onChange={(event) => onChange(event.target.value, "0")}
        >
          <option value="0">Selecione uma UF</option>
          {ufs.map((option) => (
            <option value={option.initials} key={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="city">Cidade</label>
        <select
          name="city"
          id="city"
          value={city}
          onChange={(event) => onChange(uf, event.target.value)}
        >
          <option value="0">Selecione uma cidade</option>
          {cities.map((name) => (
            <option value={name} key={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default LocationSelect
