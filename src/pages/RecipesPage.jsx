import { useEffect, useState } from 'react'
import { ClockIcon, SearchIcon, XIcon } from '../assets/icons'
import { api } from '../utils/api'
import { RECIPE_FILTERS } from '../utils/constants'
import { getCurrentSeason } from '../utils/dates'
import { getRecipeNameBn } from '../utils/bangla'
import { sampleRecipes } from '../utils/sampleData'

export default function RecipesPage({ useDemo, bangla, onSyncStateChange }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      if (useDemo) {
        setData(sampleRecipes)
        onSyncStateChange?.({ kind: 'demo', message: 'Using sample data' })
        setLoading(false)
        return
      }

      try {
        const result = await api.getRecipes({})
        setData(result)
        onSyncStateChange?.({ kind: 'live', message: 'Live sync active' })
      } catch (err) {
        setData(null)
        const message = err.message || 'Unable to load recipes from Google Sheet.'
        setError(message)
        onSyncStateChange?.({ kind: 'error', message })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [onSyncStateChange, useDemo])

  const recipes = data?.recipes || []
  const currentSeason = getCurrentSeason()
  const filtered = recipes.filter((recipe) => {
    if (search.trim()) {
      const query = search.toLowerCase()
      const nameMatch = recipe.name.toLowerCase().includes(query)
      const banglaMatch = bangla && getRecipeNameBn(recipe.name).toLowerCase().includes(query)
      const tagMatch = recipe.tags?.some((tag) => tag.toLowerCase().includes(query))
      if (!nameMatch && !banglaMatch && !tagMatch) return false
    }

    if (filter === 'all') return true
    if (filter === 'dinner') return recipe.category === 'Dinner'
    if (filter === 'kid') return recipe.kidFriendly
    if (filter === 'quick') return (recipe.prepTime + recipe.cookTime) <= 30
    if (filter === 'summer') return !recipe.season || recipe.season === 'all' || recipe.season === 'summer'
    if (filter === 'winter') return !recipe.season || recipe.season === 'all' || recipe.season === 'winter'
    return true
  })

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-10 rounded-lg mb-3" />
        <div className="flex gap-1.5 mb-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton h-8 w-24 rounded-full" />
          ))}
        </div>
        {[1, 2, 3].map((item) => (
          <div key={item} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="card p-4 text-sm text-red-600 dark:text-red-300">
        <div className="font-medium mb-1">Recipe sync failed</div>
        <div>{error}</div>
      </div>
    )
  }

  if (selectedRecipe) {
    const recipe = selectedRecipe

    return (
      <div>
        <button onClick={() => setSelectedRecipe(null)} className="flex items-center gap-1 text-sm text-accent mb-3">
          <XIcon size={16} /> {bangla ? 'রেসিপিতে ফিরুন' : 'Back to recipes'}
        </button>
        <div className="card p-4">
          <h2 className="text-base font-medium mb-0.5">
            {bangla ? getRecipeNameBn(recipe.name) : recipe.name}
          </h2>
          {bangla && <div className="text-[12px] text-gray-400 mb-1">{recipe.name}</div>}

          <div className="flex gap-2 flex-wrap mb-3">
            {recipe.tags?.map((tag) => (
              <span key={tag} className="badge badge-diabetic">{tag}</span>
            ))}
            {recipe.kidFriendly && <span className="badge badge-kid">kid-friendly</span>}
            {recipe.season && recipe.season !== 'all' && (
              <span
                className="badge"
                style={{
                  background: recipe.season === 'summer' ? '#FFF3E0' : '#E3F2FD',
                  color: recipe.season === 'summer' ? '#E65100' : '#1565C0',
                }}
              >
                {recipe.season === 'summer' ? 'Summer' : 'Winter'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Calories', value: recipe.calories, unit: 'kcal' },
              { label: 'Carbs', value: recipe.carbs, unit: 'g' },
              { label: 'Protein', value: recipe.protein, unit: 'g' },
              { label: 'Fat', value: recipe.fat, unit: 'g' },
            ].map((item) => (
              <div key={item.label} className="stat-card">
                <div className="text-[16px] font-medium">{item.value}</div>
                <div className="text-[11px] text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[13px] text-gray-500 mb-4">
            <span className="flex items-center gap-1"><ClockIcon size={14} /> Prep: {recipe.prepTime} min</span>
            <span className="flex items-center gap-1"><ClockIcon size={14} /> Cook: {recipe.cookTime} min</span>
            <span className="font-medium text-accent">Total: {recipe.prepTime + recipe.cookTime} min</span>
          </div>

          <div className="mb-4">
            <h3 className="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2">
              {bangla ? 'উপকরণ (1 serving)' : 'Ingredients (1 serving)'}
            </h3>
            <div className="space-y-1.5">
              {recipe.ingredients?.map((ingredient, index) => (
                <div
                  key={`${ingredient.key}-${index}`}
                  className="flex justify-between text-[13px] py-1 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <span className="text-gray-700 dark:text-gray-300">{ingredient.key.replace(/_/g, ' ')}</span>
                  <span className="text-gray-500">{ingredient.qty} {ingredient.unit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2">
              {bangla ? 'রান্নার পদ্ধতি' : 'Method'}
            </h3>
            <div className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
              {recipe.method}
            </div>
          </div>

          {recipe.pickyModifier && (
            <div className="mb-3">
              <h3 className="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                Picky eater version
              </h3>
              <div className="picky-modifier text-[13px] py-1.5">{recipe.pickyModifier}</div>
            </div>
          )}

          {recipe.notes && (
            <div className="text-[12px] text-gray-400 italic mt-2">{recipe.notes}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="relative mb-3">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={bangla ? 'রেসিপি খুঁজুন...' : 'Search recipes...'}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:border-accent"
          style={{ borderWidth: '0.5px' }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <XIcon size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {RECIPE_FILTERS.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`filter-pill whitespace-nowrap ${filter === item.key ? 'active' : ''}`}
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

      {(filter === 'summer' || filter === 'winter') && (
        <div className="text-[11px] text-gray-400 mb-2">
          Current season: <span className="font-medium">{currentSeason === 'summer' ? 'Summer' : 'Winter'}</span>
          {' '}· Showing {filter} recipes
        </div>
      )}

      <div className="space-y-2.5">
        {filtered.map((recipe) => (
          <button
            key={recipe.id}
            onClick={() => setSelectedRecipe(recipe)}
            className="w-full text-left flex gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 transition-colors"
            style={{ borderWidth: '0.5px' }}
          >
            <div className="w-16 h-16 rounded-lg bg-accent-light dark:bg-accent-dark/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[22px] text-accent font-medium">
                {recipe.name.charAt(0)}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium mb-0.5 truncate">
                {bangla ? getRecipeNameBn(recipe.name) : recipe.name}
              </div>
              <div className="flex gap-1 flex-wrap mb-1.5">
                {recipe.tags?.slice(0, 2).map((tag) => (
                  <span key={tag} className="badge badge-diabetic">{tag}</span>
                ))}
                {recipe.kidFriendly && <span className="badge badge-kid">kid-ok</span>}
                {recipe.season && recipe.season !== 'all' && (
                  <span className="text-[10px]">{recipe.season === 'summer' ? 'S' : 'W'}</span>
                )}
              </div>
              <div className="flex gap-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                  {recipe.calories} kcal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  {recipe.carbs}g carb
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                  {recipe.prepTime + recipe.cookTime} min
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          {bangla ? 'কোনও রেসিপি মেলেনি।' : 'No recipes match this filter.'}
        </div>
      )}
    </div>
  )
}
