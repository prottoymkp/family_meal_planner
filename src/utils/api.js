const API_KEY = 'MEAL_PLANNER_API_URL'
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbzdKhkahyOtt6zT06_jP60-6I46fGI-xzM2F9DKdKYXuvDWOSkrBHX7ygyEijtnVE17hg/exec'

export function getApiUrl() {
  return localStorage.getItem(API_KEY) || DEFAULT_API_URL
}

export function setApiUrl(url) {
  localStorage.setItem(API_KEY, url.trim())
}

export function isApiConfigured() {
  return !!getApiUrl()
}

async function fetchApi(action, params = {}) {
  const base = getApiUrl()
  if (!base) throw new Error('API_NOT_CONFIGURED')

  const url = new URL(base)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  })

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

async function postApi(body) {
  const base = getApiUrl()
  if (!base) throw new Error('API_NOT_CONFIGURED')

  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const api = {
  ping:           ()           => fetchApi('ping'),
  getMealPlan:    (weekStart)  => fetchApi('getMealPlan', { weekStart }),
  getMealPlanDay: (date)       => fetchApi('getMealPlanDay', { date }),
  getRecipes:     (params={})  => fetchApi('getRecipes', params),
  getRecipe:      (id)         => fetchApi('getRecipe', { id }),
  getFamily:      ()           => fetchApi('getFamily'),
  getShopping:    (params={})  => fetchApi('getShopping', params),
  getKitchenDay:  (date)       => fetchApi('getKitchenDay', { date }),
  getPickyNotes:  (memberId)   => fetchApi('getPickyNotes', { memberId }),
  getDashboard:   ()           => fetchApi('getDashboard'),
  toggleShopping: (row, checked) => postApi({ action: 'toggleShopping', row, checked }),
}
