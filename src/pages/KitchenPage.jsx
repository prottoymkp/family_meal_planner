import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { sampleKitchenDay } from '../utils/sampleData'
import { AlertIcon } from '../assets/icons'

export default function KitchenPage({ today, useDemo }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (useDemo) throw new Error('demo')
        const result = await api.getKitchenDay(today)
        setData(result)
      } catch {
        setData(sampleKitchenDay)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [today, useDemo])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="skeleton h-16 rounded-lg" />
          <div className="skeleton h-16 rounded-lg" />
        </div>
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="stat-card">
          <div className="text-[22px] font-medium">{data.peopleToFeed}</div>
          <div className="text-[11px] text-gray-500">People to feed</div>
        </div>
        <div className="stat-card">
          <div className="text-[22px] font-medium">{data.mealsToday}</div>
          <div className="text-[11px] text-gray-500">Meals today</div>
        </div>
      </div>

      {/* Section header */}
      <div className="text-[13px] font-medium text-gray-500 mb-2">Today's timeline</div>

      {/* Timeline tasks */}
      <div className="space-y-2">
        {data.timeline?.map((task, i) => (
          <div key={i} className="kitchen-task">
            <div className="text-[12px] font-medium text-accent min-w-[56px]">
              {task.prepTime}
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-medium mb-0.5">
                {task.slot === 'Shopping' ? 'Market run (daily fresh)' : `Prep ${task.slot?.toLowerCase()}`}
              </div>
              <div className="text-[12px] text-gray-500 mb-1">
                {task.slot === 'Shopping'
                  ? task.kitchenNotes || 'Buy fresh items for today'
                  : task.recipe
                }
              </div>

              {/* Portions summary for meal tasks */}
              {task.portions && task.slot === 'Dinner' && (
                <div className="text-[11px] text-gray-400 mb-1">
                  M: {task.portions.muhtasim} · Kids: {task.portions.kids}
                </div>
              )}

              {/* Picky modifier */}
              {task.pickyModifier && task.slot !== 'Shopping' && (
                <div className="picky-modifier text-[11px] mt-1">{task.pickyModifier}</div>
              )}

              {/* Kitchen notes */}
              {task.kitchenNotes && task.slot !== 'Shopping' && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 italic">
                  {task.kitchenNotes}
                </div>
              )}

              {/* Assignee */}
              <div className="mt-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500">
                  {task.assignedCook}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Picky eater alert card */}
      {data.pickyAlerts?.length > 0 && (
        <div className="mt-4 p-3 rounded-xl border border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-900/10" style={{ borderWidth: '0.5px' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertIcon size={16} className="text-pink-500" />
            <span className="text-[13px] font-medium text-pink-700 dark:text-pink-300">Picky eater — daughter refuses</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.pickyAlerts.map((food, i) => (
              <span key={i} className="badge badge-picky">{food}</span>
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
