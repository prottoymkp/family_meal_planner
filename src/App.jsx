import { useCallback, useEffect, useState } from 'react'
import {
  getApiUrl,
  isApiConfigured,
  isDemoMode,
  setApiUrl,
  setDemoMode,
  syncNativeWidgetConfig,
  testApiUrl,
} from './utils/api'
import { formatWeekRange, getToday, getWeekStart, shiftWeek } from './utils/dates'
import { SLOT_TIMES } from './utils/constants'
import {
  BookIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GlobeIcon,
  KitchenIcon,
  PlannerIcon,
  RefreshIcon,
  SettingsIcon,
  ShoppingIcon,
} from './assets/icons'
import CalendarPage from './pages/CalendarPage'
import KitchenPage from './pages/KitchenPage'
import PlannerPage from './pages/PlannerPage'
import RecipesPage from './pages/RecipesPage'
import ShoppingPage from './pages/ShoppingPage'

const TABS = [
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
  { id: 'shopping', label: 'Shopping', Icon: ShoppingIcon },
  { id: 'recipes', label: 'Recipes', Icon: BookIcon },
  { id: 'kitchen', label: 'Kitchen', Icon: KitchenIcon },
  { id: 'planner', label: 'Planner', Icon: PlannerIcon },
]

const TITLES = {
  calendar: "This week's meals",
  shopping: 'Shopping list',
  recipes: 'Recipe collection',
  kitchen: "Today's kitchen",
  planner: 'Plan next week',
}

function getInitialSyncState(useDemo, configured) {
  if (useDemo || !configured) {
    return { kind: 'demo', message: 'Using sample data' }
  }

  return { kind: 'live', message: 'Live sync active' }
}

export default function App() {
  const [tab, setTab] = useState('calendar')
  const [configured, setConfigured] = useState(isApiConfigured())
  const [showSetup, setShowSetup] = useState(false)
  const [urlInput, setUrlInput] = useState(getApiUrl())
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [useDemo, setUseDemo] = useState(isDemoMode())
  const [weekStart, setWeekStart] = useState(getWeekStart())
  const [bangla, setBangla] = useState(() => localStorage.getItem('MEAL_PLANNER_BANGLA') === 'true')
  const [refreshKey, setRefreshKey] = useState(0)
  const [syncState, setSyncState] = useState(() => getInitialSyncState(isDemoMode(), isApiConfigured()))
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem('MEAL_PLANNER_NOTIF') === 'true'
  )

  const today = getToday()

  const subtitles = {
    calendar: formatWeekRange(weekStart),
    shopping: formatWeekRange(weekStart),
    recipes: bangla ? 'Browse recipes in Bangla mode' : 'Browse all recipes',
    kitchen: `Today: ${today}`,
    planner: formatWeekRange(shiftWeek(weekStart, 1)),
  }

  useEffect(() => {
    syncNativeWidgetConfig()
  }, [])

  useEffect(() => {
    if (showSetup) {
      setUrlInput(getApiUrl())
    }
  }, [showSetup])

  function prevWeek() {
    setWeekStart((value) => shiftWeek(value, -1))
  }

  function nextWeek() {
    setWeekStart((value) => shiftWeek(value, 1))
  }

  function goThisWeek() {
    setWeekStart(getWeekStart())
  }

  const handleRefresh = useCallback(() => {
    setRefreshKey((value) => value + 1)
  }, [])

  function reportSyncState(nextState) {
    if (!nextState?.kind) return
    setSyncState(nextState)
  }

  function toggleBangla() {
    setBangla((value) => {
      const nextValue = !value
      localStorage.setItem('MEAL_PLANNER_BANGLA', String(nextValue))
      return nextValue
    })
  }

  function toggleNotifications() {
    if (!notificationsEnabled) {
      if ('Notification' in window) {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            setNotificationsEnabled(true)
            localStorage.setItem('MEAL_PLANNER_NOTIF', 'true')
          }
        })
      }
      return
    }

    setNotificationsEnabled(false)
    localStorage.setItem('MEAL_PLANNER_NOTIF', 'false')
  }

  useEffect(() => {
    if (!notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') return

    const timeoutIds = []
    const now = new Date()

    Object.entries(SLOT_TIMES).forEach(([slot, timeStr]) => {
      const [time, ampm] = timeStr.split(' ')
      const [hour, minute] = time.split(':').map(Number)
      let hour24 = ampm === 'pm' && hour !== 12 ? hour + 12 : hour
      if (ampm === 'am' && hour === 12) hour24 = 0

      const notificationTime = new Date(now)
      notificationTime.setHours(hour24, minute - 30, 0, 0)
      const delay = notificationTime.getTime() - now.getTime()

      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        const id = setTimeout(() => {
          new Notification(`${slot} prep time!`, {
            body: `Time to start preparing ${slot.toLowerCase()}. Serving at ${timeStr}.`,
            icon: '/favicon.ico',
            tag: `meal-${slot}`,
          })
        }, delay)
        timeoutIds.push(id)
      }
    })

    return () => timeoutIds.forEach(clearTimeout)
  }, [notificationsEnabled])

  const [pullY, setPullY] = useState(0)
  const [pulling, setPulling] = useState(false)
  const [startY, setStartY] = useState(0)

  function onTouchStart(event) {
    if (window.scrollY === 0) {
      setStartY(event.touches[0].clientY)
      setPulling(true)
    }
  }

  function onTouchMove(event) {
    if (!pulling) return
    const delta = event.touches[0].clientY - startY
    if (delta > 0 && delta < 120) {
      setPullY(delta)
    }
  }

  function onTouchEnd() {
    if (pullY > 60) {
      handleRefresh()
    }

    setPullY(0)
    setPulling(false)
  }

  async function handleSaveUrl() {
    setTesting(true)
    setTestResult(null)

    try {
      await testApiUrl(urlInput)
      setApiUrl(urlInput)
      setDemoMode(false)
      setConfigured(true)
      setUseDemo(false)
      setSyncState({ kind: 'live', message: 'Live sync active' })
      setTestResult({ ok: true, msg: 'Connected!' })
      setRefreshKey((value) => value + 1)
      setTimeout(() => setShowSetup(false), 800)
    } catch (err) {
      setTestResult({ ok: false, msg: err.message })
    } finally {
      setTesting(false)
    }
  }

  function handleUseDemo() {
    setDemoMode(true)
    setUseDemo(true)
    setSyncState({ kind: 'demo', message: 'Using sample data' })
    setRefreshKey((value) => value + 1)
    setShowSetup(false)
  }

  function handleUseSavedLive() {
    if (!configured) return
    setDemoMode(false)
    setUseDemo(false)
    setSyncState({ kind: 'live', message: 'Live sync active' })
    setRefreshKey((value) => value + 1)
    setShowSetup(false)
  }

  if (showSetup) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full card p-6">
          <h2 className="text-lg font-medium mb-1">Connect your Google Sheet</h2>
          <p className="text-sm text-gray-500 mb-4">
            Paste your Apps Script Web App URL below. The app will only use live data after the test passes.
          </p>
          <input
            type="url"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
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
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Meal prep reminders (30 min)</span>
              <button
                onClick={toggleNotifications}
                className={`w-10 h-6 rounded-full transition-colors ${notificationsEnabled ? 'bg-accent' : 'bg-gray-300'}`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                    notificationsEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {configured && useDemo && (
              <button onClick={handleUseSavedLive} className="w-full py-2 text-sm text-accent font-medium">
                Use saved live connection
              </button>
            )}

            <button onClick={handleUseDemo} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
              Use demo mode
            </button>
          </div>

          {(configured || useDemo) && (
            <button onClick={() => setShowSetup(false)} className="w-full py-2 text-sm text-accent mt-2">
              Back to app
            </button>
          )}
        </div>
      </div>
    )
  }

  const showWeekControls = tab === 'calendar' || tab === 'shopping' || tab === 'planner'
  const bannerKind = useDemo ? 'demo' : syncState.kind
  const bannerMessage = useDemo
    ? 'Demo mode - using sample data'
    : bannerKind === 'error'
      ? `Sync issue - ${syncState.message || 'Unable to reach your Google Sheet.'}`
      : 'Live sync active - Google Sheet connected'
  const bannerClassName = bannerKind === 'error'
    ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
    : bannerKind === 'live'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
      : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  const bannerAction = bannerKind === 'error' ? 'Fix' : useDemo ? 'Connect' : 'Change'

  return (
    <div
      className="max-w-md mx-auto min-h-screen pb-16 bg-gray-50 dark:bg-gray-950"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {pullY > 10 && (
        <div
          className="flex justify-center items-center text-accent transition-all"
          style={{ height: `${pullY}px`, opacity: Math.min(pullY / 60, 1) }}
        >
          <RefreshIcon size={20} className={pullY > 60 ? 'animate-spin' : ''} />
          <span className="text-xs ml-1.5">{pullY > 60 ? 'Release to refresh' : 'Pull to refresh'}</span>
        </div>
      )}

      <div className={`px-4 py-2 text-xs flex justify-between items-center ${bannerClassName}`}>
        <span className="pr-3">{bannerMessage}</span>
        <button onClick={() => setShowSetup(true)} className="underline font-medium">
          {bannerAction}
        </button>
      </div>

      <div className="px-4 pt-3 pb-2 flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium truncate">{TITLES[tab]}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            {showWeekControls ? (
              <>
                <button onClick={prevWeek} className="p-0.5 text-gray-400 hover:text-accent">
                  <ChevronLeftIcon size={16} />
                </button>
                <button onClick={goThisWeek} className="text-xs text-gray-500 hover:text-accent px-1">
                  {subtitles[tab]}
                </button>
                <button onClick={nextWeek} className="p-0.5 text-gray-400 hover:text-accent">
                  <ChevronRightIcon size={16} />
                </button>
              </>
            ) : (
              <p className="text-xs text-gray-500">{subtitles[tab]}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0">
          <button
            onClick={toggleBangla}
            className={`p-2.5 rounded-md ${bangla ? 'text-accent bg-accent/10' : 'text-gray-400 hover:text-gray-600'}`}
            title="Toggle Bangla"
          >
            <GlobeIcon size={18} />
          </button>
          <button onClick={handleRefresh} className="p-2.5 text-gray-400 hover:text-gray-600" title="Refresh">
            <RefreshIcon size={18} />
          </button>
          <button onClick={() => setShowSetup(true)} className="p-2.5 text-gray-400 hover:text-gray-600">
            <SettingsIcon size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        {tab === 'calendar' && (
          <CalendarPage
            key={`cal-${refreshKey}`}
            weekStart={weekStart}
            useDemo={useDemo}
            bangla={bangla}
            onSyncStateChange={reportSyncState}
          />
        )}
        {tab === 'shopping' && (
          <ShoppingPage
            key={`shop-${refreshKey}`}
            weekStart={weekStart}
            useDemo={useDemo}
            bangla={bangla}
            onSyncStateChange={reportSyncState}
          />
        )}
        {tab === 'recipes' && (
          <RecipesPage
            key={`rec-${refreshKey}`}
            useDemo={useDemo}
            bangla={bangla}
            onSyncStateChange={reportSyncState}
          />
        )}
        {tab === 'kitchen' && (
          <KitchenPage
            key={`kit-${refreshKey}`}
            today={today}
            useDemo={useDemo}
            bangla={bangla}
            onSyncStateChange={reportSyncState}
          />
        )}
        {tab === 'planner' && (
          <PlannerPage
            key={`plan-${refreshKey}`}
            weekStart={weekStart}
            useDemo={useDemo}
            bangla={bangla}
            onSyncStateChange={reportSyncState}
          />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex h-[56px] z-50">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
              tab === id ? 'text-accent' : 'text-gray-400'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
