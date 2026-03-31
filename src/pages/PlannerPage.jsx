import { useEffect, useMemo, useState } from 'react'
import { SwapIcon } from '../assets/icons'
import { api, requestWidgetRefresh } from '../utils/api'
import { getRecipeNameBn, getSlotNameBn } from '../utils/bangla'
import { formatWeekRange, getWeekDays, shiftWeek } from '../utils/dates'
import { getFoodEmoji } from '../utils/foodEmoji'
import { sampleMealPlan, sampleRecipes } from '../utils/sampleData'

export default function PlannerPage({ weekStart, useDemo, bangla, onSyncStateChange }) {
  const nextWeekStart = shiftWeek(weekStart, 1)
  const [plan, setPlan] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [swapTarget, setSwapTarget] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setLoadError('')
      setSaveError('')

      if (useDemo) {
        const cloned = cloneWeekAsPlan(sampleMealPlan, nextWeekStart)
        setPlan(cloned)
        setRecipes(sampleRecipes.recipes || [])
        onSyncStateChange?.({ kind: 'demo', message: 'Using sample data' })
        setLoading(false)
        return
      }

      try {
        const [recipeData, nextWeekData] = await Promise.all([
          api.getRecipes({}),
          api.getNextWeekPlan(nextWeekStart),
        ])

        let loadedPlan = nextWeekData
        if (!loadedPlan || !loadedPlan.days || loadedPlan.days.length === 0) {
          const currentWeek = await api.getMealPlan(weekStart)
          loadedPlan = cloneWeekAsPlan(currentWeek, nextWeekStart)
        }

        setRecipes(recipeData?.recipes || [])
        setPlan(loadedPlan)
        onSyncStateChange?.({ kind: 'live', message: 'Live sync active' })
      } catch (err) {
        setPlan(null)
        setRecipes([])
        const message = err.message || 'Unable to load planner data from Google Sheet.'
        setLoadError(message)
        onSyncStateChange?.({ kind: 'error', message })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [nextWeekStart, onSyncStateChange, useDemo, weekStart])

  const shopList = useMemo(() => calculateShopping(plan, recipes), [plan, recipes])

  function handleSwapMeal(dayIdx, slotIdx) {
    if (!plan) return

    if (swapTarget && swapTarget.dayIdx === dayIdx && swapTarget.slotIdx === slotIdx) {
      setSwapTarget(null)
      return
    }

    if (swapTarget) {
      const nextPlan = {
        ...plan,
        days: plan.days.map((day) => ({ ...day, meals: [...day.meals] })),
      }
      const firstMeal = nextPlan.days[swapTarget.dayIdx].meals[swapTarget.slotIdx]
      const secondMeal = nextPlan.days[dayIdx].meals[slotIdx]
      nextPlan.days[swapTarget.dayIdx].meals[swapTarget.slotIdx] = secondMeal
      nextPlan.days[dayIdx].meals[slotIdx] = firstMeal
      setPlan(nextPlan)
      setSwapTarget(null)
      setSaved(false)
      setSaveError('')
      return
    }

    setSwapTarget({ dayIdx, slotIdx })
  }

  function handleChangeMeal(dayIdx, slotIdx, recipeId) {
    if (!plan) return
    const recipe = recipes.find((entry) => entry.id === recipeId)
    if (!recipe) return

    const nextPlan = {
      ...plan,
      days: plan.days.map((day) => ({ ...day, meals: [...day.meals] })),
    }
    const meal = { ...nextPlan.days[dayIdx].meals[slotIdx] }
    meal.recipeId = recipe.id
    meal.recipeName = recipe.name
    meal.pickyModifier = meal.pickyModifier || recipe.pickyModifier || ''
    nextPlan.days[dayIdx].meals[slotIdx] = meal
    setPlan(nextPlan)
    setSaved(false)
    setSaveError('')
  }

  async function handleSave() {
    if (!plan) return

    setSaving(true)
    setSaveError('')

    try {
      if (useDemo) {
        throw new Error('Demo mode cannot save to Google Sheet.')
      }

      await api.saveWeekPlan({ weekStart: nextWeekStart, days: plan.days })
      setSaved(true)
      onSyncStateChange?.({ kind: 'live', message: 'Live sync active' })
      requestWidgetRefresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      const message = err.message || 'Failed to save the planner.'
      setSaveError(message)
      onSyncStateChange?.({ kind: 'error', message })
      setTimeout(() => setSaveError(''), 5000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-8 w-48 rounded-lg mb-4" />
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  if (loadError && !plan) {
    return (
      <div className="card p-4 text-sm text-red-600 dark:text-red-300">
        <div className="font-medium mb-1">Planner sync failed</div>
        <div>{loadError}</div>
      </div>
    )
  }

  if (!plan) return null

  return (
    <div>
      <div className="text-[13px] text-gray-500 mb-3">
        {bangla ? 'পরিকল্পনা:' : 'Planning:'}{' '}
        <span className="font-medium text-gray-700 dark:text-gray-300">{formatWeekRange(nextWeekStart)}</span>
      </div>

      {loadError && (
        <div className="mb-3 text-[12px] text-red-500">
          {loadError}
        </div>
      )}

      {plan.days.map((day, dayIdx) => (
        <div key={day.date} className="mb-4">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            {day.day} - {day.date.slice(5)}
          </div>
          <div className="card p-2">
            {day.meals.length === 0 ? (
              <div className="text-[13px] text-gray-400 px-2 py-3">
                {bangla ? 'এই দিনের জন্য কোনও meal slot নেই।' : 'No meal slots are set for this day yet.'}
              </div>
            ) : (
              day.meals.map((meal, slotIdx) => {
                const isSwapSource = swapTarget?.dayIdx === dayIdx && swapTarget?.slotIdx === slotIdx
                return (
                  <div
                    key={`${meal.slot}-${slotIdx}`}
                    className={`flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${isSwapSource ? 'bg-accent/10 rounded-lg px-1' : ''}`}
                  >
                    <span className="text-[16px] w-7 text-center flex-shrink-0">
                      {getFoodEmoji(meal.recipeName, meal.slot)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-gray-400 uppercase">
                        {bangla ? getSlotNameBn(meal.slot) : meal.slot}
                      </div>
                      <select
                        value={meal.recipeId || ''}
                        onChange={(event) => handleChangeMeal(dayIdx, slotIdx, event.target.value)}
                        className="w-full text-[13px] font-medium bg-transparent border-none outline-none cursor-pointer p-0 -ml-0.5 text-gray-800 dark:text-gray-200"
                      >
                        <option value={meal.recipeId || ''}>{bangla ? getRecipeNameBn(meal.recipeName) : meal.recipeName}</option>
                        {recipes
                          .filter((recipe) => recipe.id !== meal.recipeId)
                          .map((recipe) => (
                            <option key={recipe.id} value={recipe.id}>
                              {recipe.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleSwapMeal(dayIdx, slotIdx)}
                      className={`p-1.5 rounded-md ${isSwapSource ? 'bg-accent text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      title="Swap with another meal"
                    >
                      <SwapIcon size={14} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ))}

      {shopList.length > 0 && (
        <div className="mb-4">
          <div className="text-[13px] font-medium text-gray-500 mb-2">
            {bangla ? 'স্বয়ংক্রিয় বাজার তালিকা' : 'Auto-calculated shopping'}
          </div>
          <div className="card p-2">
            {shopList.map((item) => (
              <div
                key={`${item.name}-${item.unit}`}
                className="flex justify-between text-[12px] py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              >
                <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                <span className="text-gray-500">{item.qty} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || saved}
        className={`w-full py-3 rounded-xl text-white text-sm font-medium disabled:opacity-60 mb-2 ${saved ? 'bg-green-600' : 'bg-accent'}`}
      >
        {saving
          ? bangla ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'
          : saved
            ? 'Saved!'
            : bangla ? 'গুগল শিটে সংরক্ষণ করুন' : 'Save plan to Google Sheet'}
      </button>

      {saveError && (
        <div className="text-[12px] text-red-500 text-center mb-4 px-2">
          {saveError}
        </div>
      )}

      {swapTarget && (
        <div className="fixed bottom-[70px] left-0 right-0 max-w-md mx-auto px-4">
          <div className="bg-accent text-white text-center py-2 rounded-lg text-sm shadow-lg">
            Tap another meal to swap with
          </div>
        </div>
      )}
    </div>
  )
}

function cloneWeekAsPlan(source, newWeekStart) {
  if (!source?.days) return { weekStart: newWeekStart, days: [] }

  const newDays = getWeekDays(newWeekStart)
  return {
    weekStart: newWeekStart,
    days: newDays.map((day, index) => {
      const sourceDay = source.days[index % source.days.length] || { meals: [] }
      return {
        date: day.date,
        day: day.dayName,
        meals: (sourceDay.meals || []).map((meal) => ({ ...meal })),
      }
    }),
  }
}

function calculateShopping(plan, recipes) {
  if (!plan?.days?.length || !recipes?.length) return []

  const recipeIndex = new Map(recipes.map((recipe) => [recipe.id, recipe]))
  const ingredientMap = new Map()

  for (const day of plan.days) {
    for (const meal of day.meals || []) {
      const recipe = recipeIndex.get(meal.recipeId)
      if (!recipe?.ingredients?.length) continue

      const baseServings = recipe.baseServings || 1
      const scale = (meal.cookScaledFor || baseServings) / baseServings

      for (const ingredient of recipe.ingredients) {
        const name = ingredient.key.replace(/_/g, ' ')
        const current = ingredientMap.get(name)
        const quantity = (Number(ingredient.qty) || 0) * scale

        if (current) {
          current.qty += quantity
        } else {
          ingredientMap.set(name, {
            name,
            qty: quantity,
            unit: ingredient.unit,
          })
        }
      }
    }
  }

  return Array.from(ingredientMap.values()).map((item) => ({
    ...item,
    qty: Math.round(item.qty * 10) / 10,
  }))
}
