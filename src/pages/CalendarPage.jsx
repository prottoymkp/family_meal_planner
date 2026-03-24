import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { getWeekDays, getToday } from '../utils/dates'
import { SLOT_TIMES } from '../utils/constants'
import { sampleMealPlan } from '../utils/sampleData'
import { getFoodEmoji, getBgColor } from '../utils/foodEmoji'

export default function CalendarPage({ weekStart, useDemo }) {
  const [days] = useState(() => getWeekDays(weekStart))
  const [selectedDate, setSelectedDate] = useState(getToday())
  const [mealPlan, setMealPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (useDemo) throw new Error('demo')
        const data = await api.getMealPlan(weekStart)
        setMealPlan(data)
      } catch {
        setMealPlan(sampleMealPlan)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [weekStart, useDemo])

  const todayMeals = mealPlan?.days?.find(d => d.date === selectedDate)?.meals || []

  return (
    <div>
      {/* Day strip */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {days.map(d => (
          <button
            key={d.date}
            onClick={() => setSelectedDate(d.date)}
            className={`day-chip ${d.date === selectedDate ? 'active' : ''} ${d.isToday ? 'ring-1 ring-accent/30' : ''}`}
          >
            <div className="text-[12px] font-medium">{d.dayShort}</div>
            <div className="text-[15px] font-medium mt-0.5">{d.dayNum}</div>
          </button>
        ))}
      </div>

      {/* Meal cards */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : todayMeals.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No meals planned for this day yet.
          <br />Edit the MealPlan sheet to add meals.
        </div>
      ) : (
        todayMeals.map((meal, i) => (
          <div key={i} className="mb-3">
            <div className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">
              {meal.slot} — {SLOT_TIMES[meal.slot] || ''}
            </div>
            <div className="meal-card">
              {/* Meal header with food emoji thumbnail */}
              <div className="flex items-start gap-3 mb-1.5">
                <div className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: getBgColor(i) }}>
                  {getFoodEmoji(meal.recipeName, meal.slot)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium leading-tight">{meal.recipeName}</div>
                  {/* Calorie/macro info */}
                  {meal.calories ? (
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {meal.calories} cal · {meal.carbs}g carb · {meal.protein}g protein
                    </div>
                  ) : meal.portions?.muhtasim && (
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {meal.portions.muhtasim.match(/\d+g?\s*carb/i)?.[0] || ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Portion badges */}
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
                </div>
              )}

              {/* Picky modifier */}
              {meal.pickyModifier && (
                <div className="picky-modifier">{meal.pickyModifier}</div>
              )}

              {/* Portion grid for dinner */}
              {meal.slot === 'Dinner' && meal.portions && (
                <div className="grid grid-cols-2 gap-2 mt-2.5">
                  {Object.entries(meal.portions).map(([who, what]) => (
                    <div key={who} className="rounded-lg border border-gray-100 dark:border-gray-800 p-2 text-[12px]">
                      <div className="font-medium capitalize mb-0.5">
                        {who === 'muhtasim' ? 'Muhtasim' : who === 'adults' ? 'Adults' : who === 'teens' ? 'Teens' : 'Kids'}
                      </div>
                      <div className="text-gray-500">{what}</div>
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
