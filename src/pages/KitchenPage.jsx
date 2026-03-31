import { useEffect, useState } from 'react'
import { AlertIcon } from '../assets/icons'
import { api } from '../utils/api'
import { getRecipeNameBn, getSlotNameBn } from '../utils/bangla'
import { sampleKitchenDay } from '../utils/sampleData'

export default function KitchenPage({ today, useDemo, bangla, onSyncStateChange }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      if (useDemo) {
        setData(sampleKitchenDay)
        onSyncStateChange?.({ kind: 'demo', message: 'Using sample data' })
        setLoading(false)
        return
      }

      try {
        const result = await api.getKitchenDay(today)
        setData(result)
        onSyncStateChange?.({ kind: 'live', message: 'Live sync active' })
      } catch (err) {
        setData(null)
        const message = err.message || 'Unable to load today\'s kitchen timeline.'
        setError(message)
        onSyncStateChange?.({ kind: 'error', message })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [onSyncStateChange, today, useDemo])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="skeleton h-16 rounded-lg" />
          <div className="skeleton h-16 rounded-lg" />
        </div>
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="skeleton h-20 rounded-lg" />
        ))}
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="card p-4 text-sm text-red-600 dark:text-red-300">
        <div className="font-medium mb-1">Kitchen sync failed</div>
        <div>{error}</div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="stat-card">
          <div className="text-[22px] font-medium">{data.peopleToFeed}</div>
          <div className="text-[11px] text-gray-500">{bangla ? 'খাওয়াতে হবে' : 'People to feed'}</div>
        </div>
        <div className="stat-card">
          <div className="text-[22px] font-medium">{data.mealsToday}</div>
          <div className="text-[11px] text-gray-500">{bangla ? 'আজকের খাবার' : 'Meals today'}</div>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-[12px] text-red-500">
          {error}
        </div>
      )}

      <div className="text-[13px] font-medium text-gray-500 mb-2">
        {bangla ? 'আজকের সময়সূচি' : "Today's timeline"}
      </div>

      <div className="space-y-2">
        {data.timeline?.map((task, index) => (
          <div key={`${task.slot}-${index}`} className="kitchen-task">
            <div className="text-[12px] font-medium text-accent min-w-[56px]">
              {task.prepTime}
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-medium mb-0.5">
                {task.slot === 'Shopping'
                  ? bangla ? 'বাজার করা (তাজা)' : 'Market run (daily fresh)'
                  : bangla ? `${getSlotNameBn(task.slot)} প্রস্তুতি` : `Prep ${task.slot?.toLowerCase()}`}
              </div>
              <div className="text-[12px] text-gray-500 mb-1">
                {task.slot === 'Shopping'
                  ? task.kitchenNotes || (bangla ? 'আজকের তাজা জিনিস কিনুন' : 'Buy fresh items for today')
                  : bangla ? getRecipeNameBn(task.recipe) : task.recipe}
              </div>

              {task.portions && task.slot === 'Dinner' && (
                <div className="text-[11px] text-gray-400 mb-1">
                  M: {task.portions.muhtasim} - Kids: {task.portions.kids}
                </div>
              )}

              {task.pickyModifier && task.slot !== 'Shopping' && (
                <div className="picky-modifier text-[11px] mt-1">{task.pickyModifier}</div>
              )}

              {task.kitchenNotes && task.slot !== 'Shopping' && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 italic">
                  {task.kitchenNotes}
                </div>
              )}

              <div className="mt-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500">
                  {task.assignedCook}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.pickyAlerts?.length > 0 && (
        <div
          className="mt-4 p-3 rounded-xl border border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-900/10"
          style={{ borderWidth: '0.5px' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertIcon size={16} className="text-pink-500" />
            <span className="text-[13px] font-medium text-pink-700 dark:text-pink-300">
              {bangla ? 'বাছাই খাদ্য - মেয়ে খায় না' : 'Picky eater - daughter refuses'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.pickyAlerts.map((food, index) => (
              <span key={`${food}-${index}`} className="badge badge-picky">{food}</span>
            ))}
          </div>
          <div className="text-[11px] text-pink-600/70 dark:text-pink-400/70 mt-2">
            Always have dal-bhaat + fried egg ready as backup.
          </div>
        </div>
      )}
    </div>
  )
}
