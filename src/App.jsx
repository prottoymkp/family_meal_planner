import { useState, useEffect } from 'react'
import { isApiConfigured, setApiUrl, getApiUrl, api } from './utils/api'
import { getWeekStart, formatWeekRange, getToday } from './utils/dates'
import { CalendarIcon, ShoppingIcon, BookIcon, KitchenIcon, SettingsIcon } from './assets/icons'
import CalendarPage from './pages/CalendarPage'
import ShoppingPage from './pages/ShoppingPage'
import RecipesPage from './pages/RecipesPage'
import KitchenPage from './pages/KitchenPage'

const TABS = [
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
  { id: 'shopping', label: 'Shopping', Icon: ShoppingIcon },
  { id: 'recipes',  label: 'Recipes',  Icon: BookIcon },
  { id: 'kitchen',  label: 'Kitchen',  Icon: KitchenIcon },
]

const TITLES = {
  calendar: "This week's meals",
  shopping: 'Shopping list',
  recipes:  'Recipe collection',
  kitchen:  "Today's kitchen",
}

export default function App() {
  const [tab, setTab] = useState('calendar')
  const [configured, setConfigured] = useState(isApiConfigured())
  const [showSetup, setShowSetup] = useState(false)
  const [urlInput, setUrlInput] = useState(getApiUrl())
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [useDemo, setUseDemo] = useState(!isApiConfigured())

  const weekStart = getWeekStart()
  const today = getToday()

  const subtitles = {
    calendar: formatWeekRange(weekStart),
    shopping: `Today: ${today}`,
    recipes:  '20 recipes across 4 categories',
    kitchen:  `Today: ${today}`,
  }

  async function handleSaveUrl() {
    setTesting(true)
    setTestResult(null)
    setApiUrl(urlInput)
    try {
      await api.ping()
      setTestResult({ ok: true, msg: 'Connected!' })
      setConfigured(true)
      setUseDemo(false)
      setTimeout(() => setShowSetup(false), 800)
    } catch (err) {
      setTestResult({ ok: false, msg: err.message })
    } finally {
      setTesting(false)
    }
  }

  function handleUseDemo() {
    setUseDemo(true)
    setShowSetup(false)
  }

  if (showSetup) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full card p-6">
          <h2 className="text-lg font-medium mb-1">Connect your Google Sheet</h2>
          <p className="text-sm text-gray-500 mb-4">
            Paste your Apps Script Web App URL below. See SETUP_GUIDE.md for instructions.
          </p>
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm mb-3 focus:outline-none focus:border-accent"
          />
          <button
            onClick={handleSaveUrl}
            disabled={testing || !urlInput.trim()}
            className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50 mb-2"
          >
            {testing ? 'Testing...' : 'Connect & test'}
          </button>
          {testResult && (
            <p className={`text-sm text-center ${testResult.ok ? 'text-green-600' : 'text-red-500'}`}>
              {testResult.msg}
            </p>
          )}
          <div className="border-t border-gray-200 mt-4 pt-4">
            <button onClick={handleUseDemo} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
              Skip — use sample data for now
            </button>
          </div>
          {configured && (
            <button onClick={() => setShowSetup(false)} className="w-full py-2 text-sm text-accent mt-2">
              Back to app
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto min-h-screen pb-16 bg-gray-50 dark:bg-gray-950">
      {/* Demo mode banner */}
      {useDemo && (
        <div className="bg-amber-50 dark:bg-amber-900/30 px-4 py-2 text-xs text-amber-700 dark:text-amber-300 flex justify-between items-center">
          <span>Sample data — <button onClick={() => setShowSetup(true)} className="underline font-medium">connect your Sheet</button></span>
        </div>
      )}

      {/* Top bar */}
      <div className="px-4 pt-3 pb-2 flex justify-between items-start">
        <div>
          <h1 className="text-lg font-medium">{TITLES[tab]}</h1>
          <p className="text-xs text-gray-500">{subtitles[tab]}</p>
        </div>
        <button onClick={() => setShowSetup(true)} className="p-1.5 text-gray-400 hover:text-gray-600">
          <SettingsIcon size={18} />
        </button>
      </div>

      {/* Active page */}
      <div className="px-4 pb-4">
        {tab === 'calendar' && <CalendarPage weekStart={weekStart} useDemo={useDemo} />}
        {tab === 'shopping' && <ShoppingPage today={today} useDemo={useDemo} />}
        {tab === 'recipes'  && <RecipesPage useDemo={useDemo} />}
        {tab === 'kitchen'  && <KitchenPage today={today} useDemo={useDemo} />}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex h-[60px] z-50">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] transition-colors ${
              tab === id ? 'text-accent' : 'text-gray-400'
            }`}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
