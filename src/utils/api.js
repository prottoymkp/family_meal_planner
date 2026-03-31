const API_KEY = 'MEAL_PLANNER_API_URL'
const DEMO_KEY = 'MEAL_PLANNER_DEMO_MODE'

function getStoredValue(key) {
  try {
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore storage failures and let the runtime continue.
  }
}

function removeStoredValue(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore storage failures and let the runtime continue.
  }
}

function getNativeBridge() {
  if (typeof window === 'undefined') return null
  return window.MealPlannerNative || null
}

function syncNativeConfig() {
  const bridge = getNativeBridge()
  if (!bridge || typeof bridge.syncConfig !== 'function') return

  try {
    bridge.syncConfig(getApiUrl(), String(isDemoMode()))
  } catch {
    // Ignore native bridge failures on web.
  }
}

function getFetchBase(overrideBase = null) {
  const base = (overrideBase ?? getApiUrl()).trim()
  if (!base) {
    throw new Error('Connect your Google Sheet to use live data.')
  }
  return base
}

async function fetchJson(res) {
  let data

  try {
    data = await res.json()
  } catch {
    throw new Error('The Apps Script response was not valid JSON.')
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}

async function fetchApi(action, params = {}, overrideBase = null) {
  const base = getFetchBase(overrideBase)
  const url = new URL(base)

  url.searchParams.set('action', action)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  return fetchJson(res)
}

async function postApi(body, overrideBase = null) {
  const base = getFetchBase(overrideBase)
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  return fetchJson(res)
}

export function getApiUrl() {
  return getStoredValue(API_KEY).trim()
}

export function setApiUrl(url) {
  setStoredValue(API_KEY, url.trim())
  syncNativeConfig()
}

export function clearApiUrl() {
  removeStoredValue(API_KEY)
  syncNativeConfig()
}

export function isApiConfigured() {
  return !!getApiUrl()
}

export function isDemoMode() {
  const value = getStoredValue(DEMO_KEY)
  if (!value) return !isApiConfigured()
  return value === 'true'
}

export function setDemoMode(enabled) {
  setStoredValue(DEMO_KEY, String(Boolean(enabled)))
  syncNativeConfig()
}

export function syncNativeWidgetConfig() {
  syncNativeConfig()
}

export function requestWidgetRefresh() {
  const bridge = getNativeBridge()
  if (!bridge || typeof bridge.requestWidgetRefresh !== 'function') return

  try {
    bridge.requestWidgetRefresh()
  } catch {
    // Ignore native bridge failures on web.
  }
}

export function testApiUrl(url) {
  return fetchApi('ping', {}, url)
}

export const api = {
  ping: () => fetchApi('ping'),
  getMealPlan: (weekStart) => fetchApi('getMealPlan', { weekStart }),
  getMealPlanDay: (date) => fetchApi('getMealPlanDay', { date }),
  getRecipes: (params = {}) => fetchApi('getRecipes', params),
  getRecipe: (id) => fetchApi('getRecipe', { id }),
  getFamily: () => fetchApi('getFamily'),
  getShopping: (params = {}) => fetchApi('getShopping', params),
  getKitchenDay: (date) => fetchApi('getKitchenDay', { date }),
  getPickyNotes: (memberId) => fetchApi('getPickyNotes', { memberId }),
  getDashboard: () => fetchApi('getDashboard'),
  getNextWeekPlan: (weekStart) => fetchApi('getNextWeekPlan', { weekStart }),
  toggleShopping: (row, checked) => postApi({ action: 'toggleShopping', row, checked }),
  saveWeekPlan: (plan) => postApi({ action: 'saveWeekPlan', ...plan }),
  generateShopping: (weekStart) => postApi({ action: 'generateShopping', weekStart }),
}
