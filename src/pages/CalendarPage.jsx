import { useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api'
import { SLOT_TIMES } from '../utils/constants'
import { getToday, getWeekDays } from '../utils/dates'
import { getRecipeNameBn, getSlotNameBn } from '../utils/bangla'
import { getBgColor, getFoodEmoji } from '../utils/foodEmoji'
import { sampleMealPlan } from '../utils/sampleData'

export default function CalendarPage({ weekStart, useDemo, bangla, onSyncStateChange }) {
  const days = useMemo(() => getWeekDays(weekStart), [weekStart])
  const [selectedDate, setSelectedDate] = useState(null)
  const [mealPlan, setMealPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const today = getToday()
    const inWeek = days.find((day) => day.date === today)
    setSelectedDate(inWeek ? today : days[0]?.date || null)
  }, [days, weekStart])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      if (useDemo) {
        setMealPlan(sampleMealPlan)
        onSyncStateChange?.({ kind: 'demo', message: 'Using sample data' })
        setLoading(false)
        return
      }

      try {
        const data = await api.getMealPlan(weekStart)
        setMealPlan(data)
        onSyncStateChange?.({ kind: 'live', message: 'Live sync active' })
      } catch (err) {
        setMealPlan(null)
        const message = err.message || 'Unable to load this week from Google Sheet.'
        setError(message)
        onSyncStateChange?.({ kind: 'error', message })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [onSyncStateChange, useDemo, weekStart])

  const todayMeals = mealPlan?.days?.find((day) => day.date === selectedDate)?.meals || []

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-4 text-sm text-red-600 dark:text-red-300">
        <div className="font-medium mb-1">Calendar sync failed</div>
        <div>{error}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {days.map((day) => (
          <button
            key={day.date}
            onClick={() => setSelectedDate(day.date)}
            className={`day-chip ${day.date === selectedDate ? 'active' : ''} ${day.isToday ? 'ring-1 ring-accent/30' : ''}`}
          >
            <div className="text-[12px] font-medium">{day.dayShort}</div>
            <div className="text-[15px] font-medium mt-0.5">{day.dayNum}</div>
          </button>
        ))}
      </div>

      {todayMeals.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {bangla ? 'এই দিনের জন্য কোনও খাবার পরিকল্পনা নেই।' : 'No meals planned for this day yet.'}
          <br />
          {bangla ? 'MealPlan শিটে খাবার যোগ করুন।' : 'Edit the MealPlan sheet to add meals.'}
        </div>
      ) : (
        todayMeals.map((meal, index) => (
          <div key={`${meal.slot}-${meal.recipeId || index}`} className="mb-3">
            <div className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">
              {bangla ? getSlotNameBn(meal.slot) : meal.slot} - {SLOT_TIMES[meal.slot] || ''}
            </div>
            <div className="meal-card">
              <div className="flex items-start gap-3 mb-1.5">
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: getBgColor(index) }}
                >
                  {getFoodEmoji(meal.recipeName, meal.slot)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium leading-tight">
                    {bangla ? getRecipeNameBn(meal.recipeName) : meal.recipeName}
                  </div>
                  {meal.calories ? (
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {meal.calories} cal - {meal.carbs}g carb - {meal.protein}g protein
                    </div>
                  ) : meal.portions?.muhtasim ? (
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {meal.portions.muhtasim.match(/\d+g?\s*carb/i)?.[0] || meal.portions.muhtasim}
                    </div>
                  ) : null}
                </div>
              </div>

              {meal.portions && (
                <div className="flex gap-1 flex-wrap mb-1.5">
                  {meal.portions.muhtasim && (
                    <span className="badge badge-diabetic">M: {meal.portions.muhtasim}</span>
                  )}
                  {meal.portions.adults && (
                    <span className="badge badge-general">A: {meal.portions.adults}</span>
                  )}
                  {meal.portions.teens && (
                    <span className="badge badge-teen">T: {meal.portions.teens}</span>
                  )}
                  {meal.portions.kids && (
                    <span className="badge badge-kid">K: {meal.portions.kids}</span>
                  )}
                </div>
              )}

              {meal.pickyModifier && <div className="picky-modifier">{meal.pickyModifier}</div>}

              {meal.slot === 'Dinner' && meal.portions && (
                <div className="grid grid-cols-2 gap-2 mt-2.5">
                  {Object.entries(meal.portions).map(([who, portion]) => (
                    <div key={who} className="rounded-lg border border-gray-100 dark:border-gray-800 p-2 text-[12px]">
                      <div className="font-medium capitalize mb-0.5">
                        {who === 'muhtasim' ? 'Muhtasim' : who === 'adults' ? 'Adults' : who === 'teens' ? 'Teens' : 'Kids'}
                      </div>
                      <div className="text-gray-500">{portion}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
