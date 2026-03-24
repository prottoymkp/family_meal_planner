import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { RECIPE_FILTERS } from '../utils/constants'
import { sampleRecipes } from '../utils/sampleData'
import { ClockIcon, XIcon } from '../assets/icons'

export default function RecipesPage({ useDemo }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (useDemo) throw new Error('demo')
        const result = await api.getRecipes({})
        setData(result)
      } catch {
        setData(sampleRecipes)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [useDemo])

  const recipes = data?.recipes || []
  const filtered = recipes.filter(r => {
    if (filter === 'all') return true
    if (filter === 'dinner') return r.category === 'Dinner'
    if (filter === 'kid') return r.kidFriendly
    if (filter === 'quick') return (r.prepTime + r.cookTime) <= 30
    return true
  })

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-1.5 mb-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-8 w-24 rounded-full" />)}
        </div>
        {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
    )
  }

  // Recipe detail modal
  if (selectedRecipe) {
    const r = selectedRecipe
    return (
      <div>
        <button onClick={() => setSelectedRecipe(null)} className="flex items-center gap-1 text-sm text-accent mb-3">
          <XIcon size={16} /> Back to recipes
        </button>
        <div className="card p-4">
          <h2 className="text-base font-medium mb-1">{r.name}</h2>
          <div className="flex gap-2 flex-wrap mb-3">
            {r.tags?.map(t => (
              <span key={t} className="badge badge-diabetic">{t}</span>
            ))}
            {r.kidFriendly && <span className="badge badge-kid">kid-friendly</span>}
          </div>

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Calories', val: r.calories, unit: 'kcal' },
              { label: 'Carbs', val: r.carbs, unit: 'g' },
              { label: 'Protein', val: r.protein, unit: 'g' },
              { label: 'Fat', val: r.fat, unit: 'g' },
            ].map(m => (
              <div key={m.label} className="stat-card">
                <div className="text-[16px] font-medium">{m.val}</div>
                <div className="text-[11px] text-gray-500">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Time */}
          <div className="flex items-center gap-3 text-[13px] text-gray-500 mb-4">
            <span className="flex items-center gap-1"><ClockIcon size={14} /> Prep: {r.prepTime} min</span>
            <span className="flex items-center gap-1"><ClockIcon size={14} /> Cook: {r.cookTime} min</span>
            <span className="font-medium text-accent">Total: {r.prepTime + r.cookTime} min</span>
          </div>

          {/* Ingredients */}
          <div className="mb-4">
            <h3 className="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2">Ingredients (1 serving)</h3>
            <div className="space-y-1.5">
              {r.ingredients?.map((ing, i) => (
                <div key={i} className="flex justify-between text-[13px] py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-gray-700 dark:text-gray-300">{ing.key.replace(/_/g, ' ')}</span>
                  <span className="text-gray-500">{ing.qty} {ing.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Method */}
          <div className="mb-4">
            <h3 className="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2">Method</h3>
            <div className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
              {r.method}
            </div>
          </div>

          {/* Picky modifier */}
          {r.pickyModifier && (
            <div className="mb-3">
              <h3 className="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2">Picky eater version</h3>
              <div className="picky-modifier text-[13px] py-1.5">{r.pickyModifier}</div>
            </div>
          )}

          {/* Notes */}
          {r.notes && (
            <div className="text-[12px] text-gray-400 italic mt-2">{r.notes}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Filter row */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto">
        {RECIPE_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`filter-pill whitespace-nowrap ${filter === f.key ? 'active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Recipe cards */}
      <div className="space-y-2.5">
        {filtered.map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedRecipe(r)}
            className="w-full text-left flex gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 transition-colors"
            style={{ borderWidth: '0.5px' }}
          >
            {/* Thumb */}
            <div className="w-16 h-16 rounded-lg bg-accent-light dark:bg-accent-dark/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[22px] text-accent font-medium">
                {r.name.charAt(0)}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium mb-0.5 truncate">{r.name}</div>
              <div className="flex gap-1 flex-wrap mb-1.5">
                {r.tags?.slice(0, 2).map(t => (
                  <span key={t} className="badge badge-diabetic">{t}</span>
                ))}
                {r.kidFriendly && <span className="badge badge-kid">kid-ok</span>}
              </div>
              <div className="flex gap-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                  {r.calories} kcal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  {r.carbs}g carb
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                  {r.prepTime + r.cookTime} min
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          No recipes match this filter.
        </div>
      )}
    </div>
  )
}
