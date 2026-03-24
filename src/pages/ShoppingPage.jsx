import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { SHOP_FILTERS, CATEGORY_ORDER } from '../utils/constants'
import { sampleShopping } from '../utils/sampleData'
import { CheckIcon } from '../assets/icons'

export default function ShoppingPage({ today, useDemo }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (useDemo) throw new Error('demo')
        const result = await api.getShopping({})
        setData(result)
      } catch {
        setData(sampleShopping)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [useDemo])

  async function toggleItem(catKey, itemIdx) {
    const newData = { ...data, categories: { ...data.categories } }
    const cat = [...newData.categories[catKey]]
    const item = { ...cat[itemIdx], checked: !cat[itemIdx].checked }
    cat[itemIdx] = item
    newData.categories[catKey] = cat

    // Recalculate progress
    const allItems = Object.values(newData.categories).flat()
    newData.checked = allItems.filter(i => i.checked).length
    newData.total = allItems.length
    newData.progress = newData.total > 0 ? Math.round((newData.checked / newData.total) * 100) : 0

    setData(newData)

    // Persist to Sheet (fire and forget)
    if (!useDemo) {
      try { await api.toggleShopping(item.row, item.checked) } catch {}
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-1.5 mb-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-8 w-20 rounded-full" />)}
        </div>
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
      </div>
    )
  }

  if (!data) return null

  const categories = data.categories || {}
  const sortedCats = CATEGORY_ORDER.filter(c => categories[c]?.length > 0)
  // Add any categories not in the predefined order
  Object.keys(categories).forEach(c => {
    if (!sortedCats.includes(c) && categories[c]?.length > 0) sortedCats.push(c)
  })

  return (
    <div>
      {/* Filter row */}
      <div className="flex gap-1.5 mb-4">
        {SHOP_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`filter-pill ${filter === f.key ? 'active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      {sortedCats.map(catKey => {
        let items = categories[catKey] || []
        if (filter === 'daily') items = items.filter(i => i.tag === 'Daily')
        if (filter === 'weekly') items = items.filter(i => i.tag === 'Weekly')
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
              {items.map((item, idx) => {
                const origIdx = (categories[catKey] || []).indexOf(item)
                return (
                  <div
                    key={item.row}
                    className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  >
                    <button
                      onClick={() => toggleItem(catKey, origIdx)}
                      className={`check-box ${item.checked ? 'checked' : ''}`}
                    >
                      {item.checked && <CheckIcon />}
                    </button>
                    <span className={`flex-1 text-[14px] ${item.checked ? 'line-through text-gray-400' : ''}`}>
                      {item.ingredient}
                    </span>
                    <span className={`badge ${item.tag === 'Daily' ? 'badge-daily' : 'badge-weekly'}`}>
                      {item.tag?.toLowerCase()}
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
      })}

      {/* Progress bar */}
      <div className="mt-4">
        <div className="text-[13px] font-medium text-gray-500 mb-2">Shopping progress</div>
        <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${data.progress}%` }}
          />
        </div>
        <div className="text-[12px] text-gray-400 text-center">
          {data.checked} of {data.total} items checked
        </div>
      </div>
    </div>
  )
}
