import { useState, useEffect, useRef, useCallback } from 'react'
import { isApiConfigured } from '../utils/api'

const cache = new Map()

export function useApi(fetcher, deps = [], cacheKey = null) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDemo, setIsDemo] = useState(false)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (cacheKey && cache.has(cacheKey)) {
      setData(cache.get(cacheKey))
      setLoading(false)
      return
    }

    try {
      const result = await fetcherRef.current()
      if (cacheKey) cache.set(cacheKey, result)
      setData(result)
      setIsDemo(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [cacheKey])

  useEffect(() => {
    refetch()
  }, [...deps, refetch])

  return { data, loading, error, isDemo, refetch }
}

export function clearApiCache() {
  cache.clear()
}
