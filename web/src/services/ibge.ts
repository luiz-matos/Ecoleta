import axios from "axios"

const BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/estados"

export interface UF {
  id: number
  initials: string
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

export async function fetchUfs(): Promise<UF[]> {
  const response = await axios.get<IBGEUF[]>(`${BASE_URL}?orderBy=nome`)
  return response.data.map(({ id, nome, sigla }) => ({
    id,
    name: nome,
    initials: sigla,
  }))
}

export async function fetchCities(uf: string): Promise<string[]> {
  const response = await axios.get<IBGECity[]>(
    `${BASE_URL}/${uf}/municipios?orderBy=nome`
  )
  return response.data.map((city) => city.nome)
}
