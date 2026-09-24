import { useEffect, useState } from "react"
import { fetchCities, fetchUfs, UF } from "../services/ibge"

// UFs do IBGE e as cidades da UF selecionada ("0" quando nenhuma)
export default function useIbgeLocations(selectedUF: string) {
  const [ufs, setUfs] = useState<UF[]>([])
  const [citiesOfUf, setCitiesOfUf] = useState({ uf: "", names: [] as string[] })

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
      .then((names) => {
        if (!ignore) setCitiesOfUf({ uf: selectedUF, names })
      })
      .catch(console.error)
    return () => {
      ignore = true
    }
  }, [selectedUF])

  // Enquanto as cidades da UF nova não chegam, a lista fica vazia
  const cities = citiesOfUf.uf === selectedUF ? citiesOfUf.names : []
  return { ufs, cities }
}
