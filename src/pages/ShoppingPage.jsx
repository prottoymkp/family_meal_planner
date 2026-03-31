import { useEffect, useMemo, useState } from 'react'
import { CheckIcon } from '../assets/icons'
import { api, requestWidgetRefresh } from '../utils/api'
import { CATEGORY_ORDER, SHOP_FILTERS } from '../utils/constants'
import { sampleShopping } from '../utils/sampleData'

export default function ShoppingPage({ weekStart, useDemo, bangla, onSyncStateChange }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      if (useDemo) {
        setData(sampleShopping)
        onSyncStateChange?.({ kind: 'demo', message: 'Using sample data' })
        setLoading(false)
        return
      }

      try {
        const result = await api.getShopping({ weekStart })
        setData(result)
        onSyncStateChange?.({ kind: 'live', message: 'Live sync active' })
      } catch (err) {
        setData(null)
        const message = err.message || 'Unable to load shopping for this week.'
        setError(message)
        onSyncStateChange?.({ kind: 'error', message })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [onSyncStateChange, useDemo, weekStart])

  const sortedCats = useMemo(() => {
    const categories = data?.categories || {}
    const ordered = CATEGORY_ORDER.filter((category) => categories[category]?.length > 0)

    Object.keys(categories).forEach((category) => {
      if (!ordered.includes(category) && categories[category]?.length > 0) {
        ordered.push(category)
      }
    })

    return ordered
  }, [data])

  async function toggleItem(catKey, itemIdx) {
    if (!data) return

    const previousData = data
    const nextData = {
      ...data,
      categories: {
        ...data.categories,
        [catKey]: [...(data.categories[catKey] || [])],
      },
    }

    const item = nextData.categories[catKey][itemIdx]
    if (!item) return

    nextData.categories[catKey][itemIdx] = { ...item, checked: !item.checked }

    const allItems = Object.values(nextData.categories).flat()
    nextData.checked = allItems.filter((entry) => entry.checked).length
    nextData.total = allItems.length
    nextData.progress = nextData.total > 0 ? Math.round((nextData.checked / nextData.total) * 100) : 0

    setData(nextData)

    if (useDemo) return

    try {
      await api.toggleShopping(item.row, !item.checked)
      onSyncStateChange?.({ kind: 'live', message: 'Live sync active' })
      requestWidgetRefresh()
    } catch (err) {
      setData(previousData)
      const message = err.message || 'Unable to update this shopping item.'
      setError(message)
      onSyncStateChange?.({ kind: 'error', message })
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-1.5 mb-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton h-8 w-20 rounded-full" />
          ))}
        </div>
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="card p-4 text-sm text-red-600 dark:text-red-300">
        <div className="font-medium mb-1">Shopping sync failed</div>
        <div>{error}</div>
      </div>
    )
  }

  if (!data) return null

  const categories = data.categories || {}
  const hasItems = sortedCats.length > 0

  return (
    <div>
      <div className="flex gap-1.5 mb-4">
        {SHOP_FILTERS.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`filter-pill ${filter === item.key ? 'active' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3 text-[12px] text-red-500">
          {error}
        </div>
      )}

      {!hasItems ? (
        <div className="card p-4 text-sm text-gray-500">
          {bangla ? 'এই সপ্তাহের জন্য কোনও কেনাকাটার তালিকা নেই।' : 'No shopping items were generated for this week yet.'}
        </div>
      ) : (
        sortedCats.map((catKey) => {
          let items = categories[catKey] || []
          if (filter === 'daily') items = items.filter((item) => item.tag === 'Daily')
          if (filter === 'weekly') items = items.filter((item) => item.tag === 'Weekly')
          if (items.length === 0) return null

          return (
            <div key={catKey} className="mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[13px] font-medium text-gray-500">{catKey}</span>
                <span className="text-[11px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-500">
                  {items.length} items
                </span>
              </div>
              <div className="card">
                {items.map((item) => {
                  const originalIndex = (categories[catKey] || []).findIndex((entry) => entry.row === item.row)
                  return (
                    <div
                      key={item.row}
                      className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                    >
                      <button
                        onClick={() => toggleItem(catKey, originalIndex)}
                        className={`check-box ${item.checked ? 'checked' : ''}`}
                      >
                        {item.checked && <CheckIcon />}
                      </button>
                      <span className={`flex-1 text-[14px] ${item.checked ? 'line-through text-gray-400' : ''}`}>
                        {item.ingredient}
                      </span>
                      <span className={`badge ${item.tag === 'Daily' ? 'badge-daily' : 'badge-weekly'}`}>
                        {item.tag === 'Daily' ? 'daily' : 'weekly'}
                      </span>
                      <span className="text-[13px] text-gray-500 min-w-[60px] text-right">
                        {item.quantity}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      <div className="mt-4">
        <div className="text-[13px] font-medium text-gray-500 mb-2">
          {bangla ? 'বাজারের অগ্রগতি' : 'Shopping progress'}
        </div>
        <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${data.progress}%` }}
          />
        </div>
        <div className="text-[12px] text-gray-400 text-center">
          {data.checked} / {data.total} {bangla ? 'আইটেম কেনা হয়েছে' : 'items checked'}
        </div>
      </div>
    </div>
  )
}
