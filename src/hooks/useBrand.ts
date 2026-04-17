import { useState } from 'react'

export function useBrand() {
  const [brandInfo] = useState({
    name: 'GoCars',
    tagline: 'Premium Ride Sharing',
    primaryColor: '#2563eb',
  })

  return { brandInfo }
}

export function useTheme() {
  const [theme, setTheme] = useState('light')
  return { theme, setTheme }
}
