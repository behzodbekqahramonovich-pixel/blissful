import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { destinationsApi } from '../services/api'

// Barcha shaharlar koordinatalari bilan. byCode kaliti marshrut segmentlaridagi
// kod bilan bir xil: IATA, aeroportsiz shahar uchun name_uz.
export default function useCities() {
  const { data: cities = [] } = useQuery({
    queryKey: ['allCities'],
    // shortcut: bitta sahifada 500 shahargacha (backend limiti), undan oshsa sahifalab yuklash kerak
    queryFn: async () => (await destinationsApi.getCities({ page_size: 500 })).results,
    staleTime: 1000 * 60 * 30,
  })
  const byCode = useMemo(
    () => Object.fromEntries(cities.map((c) => [c.iata_code || c.name_uz, c])),
    [cities]
  )
  return { cities, byCode }
}

export const position = (city) => [Number(city.latitude), Number(city.longitude)]
