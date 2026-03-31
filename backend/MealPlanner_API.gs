const SHEET_NAMES = {
  recipeMaster: 'RecipeMaster',
  mealPlan: 'MealPlan',
  familyProfiles: 'FamilyProfiles',
  shoppingList: 'ShoppingList',
  pickyNotes: 'PickyEaterNotes',
  ingredientDb: 'IngredientDB',
}

const SLOT_ORDER = {
  Breakfast: 1,
  Lunch: 2,
  Snack: 3,
  Dinner: 4,
}

function doGet(e) {
  const action = getParam_(e, 'action', 'ping')
  let result
  try {
    switch (action) {
      case 'ping':
        result = { status: 'ok', message: 'Meal Planner API is running', timestamp: new Date().toISOString() }
        break
      case 'getRecipes':
        result = getRecipes_(e.parameter || {})
        break
      case 'getRecipe':
        result = getRecipeById_(getParam_(e, 'id', ''))
        break
      case 'getMealPlan':
        result = getMealPlan_(e.parameter || {})
        break
      case 'getMealPlanDay':
        result = getMealPlanDay_(getParam_(e, 'date', ''))
        break
      case 'getFamily':
        result = getFamily_()
        break
      case 'getShopping':
        result = getShopping_(e.parameter || {}, true)
        break
      case 'getPickyNotes':
        result = getPickyNotes_(getParam_(e, 'memberId', ''))
        break
      case 'getKitchenDay':
        result = getKitchenDay_(getParam_(e, 'date', ''))
        break
      case 'getDashboard':
        result = getDashboard_()
        break
      case 'getNextWeekPlan':
        result = getNextWeekPlan_(getParam_(e, 'weekStart', ''))
        break
      default:
        throw new Error('Unknown action: ' + action)
    }
  } catch (err) {
    result = { error: err.message }
  }
  return jsonOutput_(result)
}

function doPost(e) {
  let result
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}')
    switch (body.action) {
      case 'toggleShopping':
        result = toggleShoppingItem_(body.row, body.checked)
        break
      case 'generateShopping':
        result = generateShoppingList_(body.weekStart)
        break
      case 'saveWeekPlan':
        result = saveWeekPlan_(body)
        break
      default:
        throw new Error('Unknown POST action: ' + body.action)
    }
  } catch (err) {
    result = { error: err.message }
  }
  return jsonOutput_(result)
}

function getRecipes_(params) {
  let recipes = loadRecipeCatalog_().recipes
  if (params.category) {
    recipes = recipes.filter(function(recipe) { return recipe.category === params.category })
  }
  if (params.kidFriendly === 'true') {
    recipes = recipes.filter(function(recipe) { return recipe.kidFriendly })
  }
  if (params.season && params.season !== 'all') {
    recipes = recipes.filter(function(recipe) {
      return !recipe.season || recipe.season === 'all' || recipe.season === params.season
    })
  }
  if (params.tag) {
    const tag = String(params.tag).toLowerCase()
    recipes = recipes.filter(function(recipe) {
      return recipe.tags.some(function(value) { return value.toLowerCase().indexOf(tag) >= 0 })
    })
  }
  return { count: recipes.length, recipes: recipes }
}

function getRecipeById_(recipeId) {
  if (!recipeId) throw new Error('Recipe id is required.')
  const recipe = loadRecipeCatalog_().index[recipeId]
  if (!recipe) throw new Error('Recipe not found in RecipeMaster: ' + recipeId)
  return recipe
}

function getMealPlan_(params) {
  const weekStart = normalizeDateInput_(params.weekStart || getCurrentWeekStart_())
  const weekEnd = addDays_(weekStart, 6)
  const recipeCatalog = loadRecipeCatalog_()
  const planContext = getSheetRows_(SHEET_NAMES.mealPlan)
  const scopedRows = planContext.rows.filter(function(row) {
    const date = normalizeDateInput_(readCell_(planContext.meta, row, ['Date']))
    return date >= weekStart && date <= weekEnd
  })
  validateMealPlanRows_(planContext.meta, scopedRows, recipeCatalog.index)

  const grouped = {}
  scopedRows.forEach(function(row) {
    const date = normalizeDateInput_(readCell_(planContext.meta, row, ['Date']))
    if (!grouped[date]) {
      grouped[date] = { date: date, day: asString_(readCell_(planContext.meta, row, ['Day'])) || getDayName_(date), meals: [] }
    }
    const recipeId = asString_(readCell_(planContext.meta, row, ['Recipe ID']))
    grouped[date].meals.push(buildMealObject_(planContext.meta, row, recipeCatalog.index[recipeId]))
  })

  const days = []
  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays_(weekStart, offset)
    const day = grouped[date] || { date: date, day: getDayName_(date), meals: [] }
    day.meals.sort(compareMeals_)
    days.push(day)
  }
  return { weekStart: weekStart, days: days }
}

function getMealPlanDay_(date) {
  const targetDate = normalizeDateInput_(date || todayIso_())
  const recipeCatalog = loadRecipeCatalog_()
  const planContext = getSheetRows_(SHEET_NAMES.mealPlan)
  const rows = planContext.rows.filter(function(row) {
    return normalizeDateInput_(readCell_(planContext.meta, row, ['Date'])) === targetDate
  })
  validateMealPlanRows_(planContext.meta, rows, recipeCatalog.index)
  const meals = rows.map(function(row) {
    const recipeId = asString_(readCell_(planContext.meta, row, ['Recipe ID']))
    return buildMealObject_(planContext.meta, row, recipeCatalog.index[recipeId])
  }).sort(compareMeals_)
  return {
    date: targetDate,
    day: rows.length > 0 ? asString_(readCell_(planContext.meta, rows[0], ['Day'])) || getDayName_(targetDate) : getDayName_(targetDate),
    meals: meals,
  }
}

function getFamily_() {
  const context = getSheetRows_(SHEET_NAMES.familyProfiles, true)
  if (!context) return { count: 0, members: [] }
  const members = context.rows.map(function(row) {
    return {
      id: asString_(readCell_(context.meta, row, ['Member ID'])),
      name: asString_(readCell_(context.meta, row, ['Name'])),
      age: asNumber_(readCell_(context.meta, row, ['Age'])),
      gender: asString_(readCell_(context.meta, row, ['Gender'])),
      group: asString_(readCell_(context.meta, row, ['Dietary Group'])),
      portionMultiplier: asNumber_(readCell_(context.meta, row, ['Portion Multiplier'])) || 1,
      riceLimit: asString_(readCell_(context.meta, row, ['Rice Limit (cup/meal)'])),
      calorieTarget: asNumber_(readCell_(context.meta, row, ['Daily Calorie Target'])),
      restrictions: asString_(readCell_(context.meta, row, ['Restrictions'])),
      allergies: asString_(readCell_(context.meta, row, ['Allergies'])),
      preferences: asString_(readCell_(context.meta, row, ['Preferences'])),
      notes: asString_(readCell_(context.meta, row, ['Notes'])),
    }
  })
  return { count: members.length, members: members }
}

function getShopping_(params, allowAutogenerate) {
  const date = params.date ? normalizeDateInput_(params.date) : ''
  const weekStart = normalizeDateInput_(params.weekStart || (date ? getWeekStartForDate_(date) : getCurrentWeekStart_()))
  const scopeStart = addDays_(weekStart, -1)
  const scopeEnd = addDays_(weekStart, 6)
  let context = getSheetRows_(SHEET_NAMES.shoppingList)
  let items = filterShoppingRows_(context, date, scopeStart, scopeEnd)

  if (items.length === 0 && allowAutogenerate) {
    generateShoppingList_(weekStart)
    context = getSheetRows_(SHEET_NAMES.shoppingList)
    items = filterShoppingRows_(context, date, scopeStart, scopeEnd)
  }

  if (params.tag) {
    items = items.filter(function(item) { return item.tag === normalizeShoppingTag_(params.tag) })
  }

  const categories = {}
  items.forEach(function(item) {
    if (!categories[item.category]) categories[item.category] = []
    categories[item.category].push(item)
  })
  Object.keys(categories).forEach(function(category) {
    categories[category].sort(function(a, b) {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1
      return a.ingredient.localeCompare(b.ingredient)
    })
  })

  const checked = items.filter(function(item) { return item.checked }).length
  return {
    weekStart: weekStart,
    total: items.length,
    checked: checked,
    progress: items.length > 0 ? Math.round((checked / items.length) * 100) : 0,
    categories: categories,
  }
}

function toggleShoppingItem_(rowNumber, checked) {
  if (!rowNumber) throw new Error('Shopping row number is required.')
  const meta = getSheetMeta_(SHEET_NAMES.shoppingList)
  const checkedCol = getColumnIndex_(meta, ['Checked?', 'Checked'], true)
  meta.sheet.getRange(Number(rowNumber), checkedCol).setValue(checked ? 'Yes' : 'No')
  return { success: true, row: Number(rowNumber), checked: Boolean(checked) }
}

function getPickyNotes_(memberId) {
  const context = getSheetRows_(SHEET_NAMES.pickyNotes, true)
  if (!context) {
    return { memberId: memberId || 'all', summary: { loves: [], likes: [], dislikes: [], refuses: [], unsure: [] }, details: [] }
  }

  let rows = context.rows
  if (memberId) {
    rows = rows.filter(function(row) { return asString_(readCell_(context.meta, row, ['Member ID'])) === memberId })
  }

  const details = rows.map(function(row) {
    return {
      food: asString_(readCell_(context.meta, row, ['Food Item'])),
      status: asString_(readCell_(context.meta, row, ['Status'])),
      workaround: asString_(readCell_(context.meta, row, ['Notes / Workaround'])),
      testedDate: normalizeDateInput_(readCell_(context.meta, row, ['Tested Date']), true),
      confidence: asString_(readCell_(context.meta, row, ['Confidence'])),
    }
  })

  function foodsByStatus(status) {
    return details.filter(function(item) { return item.status === status }).map(function(item) { return item.food })
  }

  return {
    memberId: memberId || 'all',
    summary: {
      loves: foodsByStatus('Loves'),
      likes: foodsByStatus('Likes'),
      dislikes: foodsByStatus('Dislikes'),
      refuses: foodsByStatus('Refuses'),
      unsure: foodsByStatus('Unsure'),
    },
    details: details,
  }
}

function getKitchenDay_(date) {
  const targetDate = normalizeDateInput_(date || todayIso_())
  const dayPlan = getMealPlanDay_(targetDate)
  const family = getFamily_()
  const pickyNotes = getPickyNotes_('F007')
  const shopping = getShopping_({ date: targetDate }, true)
  const timeline = []
  const slotTimes = {
    Breakfast: { prep: '6:00 AM', serve: '6:30 AM' },
    Lunch: { prep: '11:30 AM', serve: '1:00 PM' },
    Snack: { prep: '4:30 PM', serve: '5:00 PM' },
    Dinner: { prep: '7:30 PM', serve: '9:30 PM' },
  }

  if (shopping.total > 0) {
    timeline.push({
      prepTime: '10:00 AM',
      serveTime: '',
      slot: 'Shopping',
      recipe: 'Daily market run',
      recipeId: '',
      scaledFor: 0,
      assignedCook: 'Shopper B',
      portions: null,
      pickyModifier: '',
      kitchenNotes: 'Buy fresh items for today',
    })
  }

  dayPlan.meals.forEach(function(meal) {
    const times = slotTimes[meal.slot] || { prep: '', serve: '' }
    timeline.push({
      prepTime: times.prep,
      serveTime: times.serve,
      slot: meal.slot,
      recipe: meal.recipeName,
      recipeId: meal.recipeId,
      scaledFor: meal.cookScaledFor,
      assignedCook: meal.assignedCook,
      portions: meal.portions,
      pickyModifier: meal.pickyModifier,
      kitchenNotes: meal.kitchenNotes,
    })
  })

  timeline.sort(function(a, b) { return toMinutes_(a.prepTime) - toMinutes_(b.prepTime) })
  return {
    date: targetDate,
    day: dayPlan.day,
    peopleToFeed: family.count,
    mealsToday: dayPlan.meals.length,
    timeline: timeline,
    pickyAlerts: pickyNotes.summary.refuses,
  }
}

function getDashboard_() {
  const weekStart = getCurrentWeekStart_()
  const shopping = getShopping_({ weekStart: weekStart }, true)
  const recipes = getRecipes_({})
  const family = getFamily_()
  const plan = getMealPlan_({ weekStart: weekStart })
  return {
    weekStart: weekStart,
    totalRecipes: recipes.count,
    familySize: family.count,
    thisWeekMeals: plan.days.reduce(function(total, day) { return total + day.meals.length }, 0),
    shoppingItems: shopping.total,
    shoppingChecked: shopping.checked,
  }
}

function getNextWeekPlan_(weekStart) {
  const targetWeekStart = normalizeDateInput_(weekStart || addDays_(getCurrentWeekStart_(), 7))
  const plan = getMealPlan_({ weekStart: targetWeekStart })
  const hasMeals = plan.days.some(function(day) { return day.meals.length > 0 })
  return hasMeals ? plan : null
}

function saveWeekPlan_(payload) {
  const weekStart = normalizeDateInput_(payload.weekStart)
  const days = Array.isArray(payload.days) ? payload.days : []
  const recipeCatalog = loadRecipeCatalog_()
  const planContext = getSheetRows_(SHEET_NAMES.mealPlan)
  const datesToReplace = {}

  days.forEach(function(day) { datesToReplace[normalizeDateInput_(day.date)] = true })

  const rowsToKeep = planContext.rows.filter(function(row) {
    const rowDate = normalizeDateInput_(readCell_(planContext.meta, row, ['Date']))
    return !datesToReplace[rowDate]
  }).map(function(row) { return row.values.slice() })

  const newRows = []
  days.forEach(function(day) {
    const date = normalizeDateInput_(day.date)
    const meals = Array.isArray(day.meals) ? day.meals.slice().sort(compareMeals_) : []
    meals.forEach(function(meal) {
      const recipeId = asString_(meal.recipeId)
      const recipe = recipeCatalog.index[recipeId]
      if (!recipe) throw new Error('MealPlan save blocked: Recipe ID not found in RecipeMaster: ' + recipeId)
      newRows.push(buildMealPlanSheetRow_(planContext.meta.headers, {
        date: date,
        day: asString_(day.day) || getDayName_(date),
        meal: meal,
        recipe: recipe,
      }))
    })
  })

  rewriteSheetData_(planContext.meta.sheet, planContext.meta.headers, rowsToKeep.concat(newRows))
  const shoppingResult = generateShoppingList_(weekStart)
  return { success: true, weekStart: weekStart, mealsWritten: newRows.length, shoppingItemsGenerated: shoppingResult.itemsGenerated }
}

function generateShoppingList_(weekStart) {
  const targetWeekStart = normalizeDateInput_(weekStart || getCurrentWeekStart_())
  const scopeStart = addDays_(targetWeekStart, -1)
  const scopeEnd = addDays_(targetWeekStart, 6)
  const recipeCatalog = loadRecipeCatalog_()
  const ingredientIndex = loadIngredientIndex_()
  const planContext = getSheetRows_(SHEET_NAMES.mealPlan)
  const shoppingContext = getSheetRows_(SHEET_NAMES.shoppingList)
  const weekRows = planContext.rows.filter(function(row) {
    const date = normalizeDateInput_(readCell_(planContext.meta, row, ['Date']))
    return date >= targetWeekStart && date <= scopeEnd
  })
  validateMealPlanRows_(planContext.meta, weekRows, recipeCatalog.index)

  const existingScopedRows = shoppingContext.rows.filter(function(row) {
    const rowDate = normalizeDateInput_(readCell_(shoppingContext.meta, row, ['Date']))
    return rowDate >= scopeStart && rowDate <= scopeEnd
  })
  const preserved = {}
  existingScopedRows.forEach(function(row) {
    const date = normalizeDateInput_(readCell_(shoppingContext.meta, row, ['Date']))
    const ingredient = asString_(readCell_(shoppingContext.meta, row, ['Ingredient']))
    const tag = normalizeShoppingTag_(readCell_(shoppingContext.meta, row, ['Shopping Tag']))
    preserved[[date, tag, ingredient].join('|')] = {
      checked: asBool_(readCell_(shoppingContext.meta, row, ['Checked?'])) ? 'Yes' : 'No',
      shopper: asString_(readCell_(shoppingContext.meta, row, ['Shopper'])),
      notes: asString_(readCell_(shoppingContext.meta, row, ['Notes'])),
    }
  })

  const aggregates = {}
  weekRows.forEach(function(row) {
    const mealDate = normalizeDateInput_(readCell_(planContext.meta, row, ['Date']))
    const recipeId = asString_(readCell_(planContext.meta, row, ['Recipe ID']))
    const recipe = recipeCatalog.index[recipeId]
    const baseServings = recipe.baseServings || 1
    const cookScaledFor = asNumber_(readCell_(planContext.meta, row, ['Cook Scaled For'])) || baseServings
    const scale = cookScaledFor / baseServings

    recipe.ingredients.forEach(function(ingredient) {
      const ingredientKey = asString_(ingredient.key)
      const ingredientMeta = ingredientIndex[ingredientKey] || {}
      const displayName = ingredientMeta.displayName || humanizeKey_(ingredientKey)
      const tag = normalizeShoppingTag_(ingredientMeta.shoppingTag || 'Daily')
      const targetDate = tag === 'Weekly' ? addDays_(targetWeekStart, -1) : mealDate
      const aggregateKey = [targetDate, tag, ingredientKey].join('|')
      if (!aggregates[aggregateKey]) {
        aggregates[aggregateKey] = {
          date: targetDate,
          ingredient: displayName,
          category: ingredientMeta.category || 'Other',
          unit: ingredient.unit || ingredientMeta.defaultUnit || '',
          tag: tag,
          quantity: 0,
        }
      }
      aggregates[aggregateKey].quantity += asNumber_(ingredient.qty) * scale
    })
  })

  const generatedRows = Object.keys(aggregates).map(function(key) {
    const item = aggregates[key]
    const display = formatQuantity_(item.quantity, item.unit)
    const preservedItem = preserved[[item.date, item.tag, item.ingredient].join('|')] || {}
    return buildShoppingSheetRow_(shoppingContext.meta.headers, {
      date: item.date,
      ingredient: item.ingredient,
      category: item.category,
      quantity: display.label,
      unit: display.unit,
      tag: item.tag,
      checked: preservedItem.checked || 'No',
      shopper: preservedItem.shopper || (item.tag === 'Weekly' ? 'Shopper A' : 'Shopper B'),
      notes: preservedItem.notes || '',
    })
  }).sort(compareShoppingRows_)

  const rowsToKeep = shoppingContext.rows.filter(function(row) {
    const rowDate = normalizeDateInput_(readCell_(shoppingContext.meta, row, ['Date']))
    return rowDate < scopeStart || rowDate > scopeEnd
  }).map(function(row) { return row.values.slice() })

  rewriteSheetData_(shoppingContext.meta.sheet, shoppingContext.meta.headers, rowsToKeep.concat(generatedRows))
  return { success: true, weekStart: targetWeekStart, itemsGenerated: generatedRows.length }
}

function loadRecipeCatalog_() {
  const context = getSheetRows_(SHEET_NAMES.recipeMaster)
  const recipes = context.rows.map(function(row) {
    return buildRecipeObject_(context.meta, row)
  }).filter(function(recipe) {
    return !!recipe.id
  })
  const index = {}
  recipes.forEach(function(recipe) { index[recipe.id] = recipe })
  return { recipes: recipes, index: index }
}

function loadIngredientIndex_() {
  const context = getSheetRows_(SHEET_NAMES.ingredientDb, true)
  if (!context) return {}
  const index = {}
  context.rows.forEach(function(row) {
    const key = asString_(readCell_(context.meta, row, ['Ingredient Key']))
    if (!key) return
    index[key] = {
      displayName: asString_(readCell_(context.meta, row, ['Display Name'])),
      category: asString_(readCell_(context.meta, row, ['Category'])) || 'Other',
      defaultUnit: asString_(readCell_(context.meta, row, ['Default Unit'])),
      shoppingTag: normalizeShoppingTag_(readCell_(context.meta, row, ['Shopping Tag'])),
      notes: asString_(readCell_(context.meta, row, ['Notes'])),
    }
  })
  return index
}

function buildRecipeObject_(meta, row) {
  return {
    id: asString_(readCell_(meta, row, ['Recipe ID'])),
    name: asString_(readCell_(meta, row, ['Name'])),
    category: asString_(readCell_(meta, row, ['Category'])),
    cuisine: asString_(readCell_(meta, row, ['Cuisine'])),
    prepTime: asNumber_(readCell_(meta, row, ['Prep Time'])),
    cookTime: asNumber_(readCell_(meta, row, ['Cook Time'])),
    difficulty: asString_(readCell_(meta, row, ['Difficulty'])),
    tags: splitCsv_(readCell_(meta, row, ['Tags'])),
    season: (asString_(readCell_(meta, row, ['Season'])) || 'all').toLowerCase(),
    kidFriendly: asBool_(readCell_(meta, row, ['Kid Friendly'])),
    pickyOk: asBool_(readCell_(meta, row, ['Picky OK'])),
    calories: asNumber_(readCell_(meta, row, ['Calories'])),
    carbs: asNumber_(readCell_(meta, row, ['Carbs'])),
    protein: asNumber_(readCell_(meta, row, ['Protein'])),
    fat: asNumber_(readCell_(meta, row, ['Fat'])),
    fiber: asNumber_(readCell_(meta, row, ['Fiber'])),
    baseServings: asNumber_(readCell_(meta, row, ['Base Servings'])) || 1,
    ingredients: parseIngredients_(readCell_(meta, row, ['Ingredients (JSON)'])),
    method: asString_(readCell_(meta, row, ['Method'])),
    pickyModifier: asString_(readCell_(meta, row, ['Picky Modifier'])),
    notes: asString_(readCell_(meta, row, ['Notes'])),
  }
}

function buildMealObject_(meta, row, recipe) {
  const portions = {}
  const portionFields = {
    muhtasim: ['Muhtasim Portion'],
    adults: ['Adults Portion'],
    teens: ['Teens Portion'],
    kids: ['Kids Portion'],
  }
  Object.keys(portionFields).forEach(function(key) {
    const value = asString_(readCell_(meta, row, portionFields[key]))
    if (value) portions[key] = value
  })

  return {
    slot: asString_(readCell_(meta, row, ['Meal Slot'])),
    recipeId: recipe.id,
    recipeName: recipe.name,
    cookScaledFor: asNumber_(readCell_(meta, row, ['Cook Scaled For'])) || recipe.baseServings || 1,
    calories: recipe.calories,
    carbs: recipe.carbs,
    protein: recipe.protein,
    fat: recipe.fat,
    fiber: recipe.fiber,
    portions: Object.keys(portions).length > 0 ? portions : null,
    pickyModifier: asString_(readCell_(meta, row, ['Picky Modifier'])) || recipe.pickyModifier || '',
    kitchenNotes: asString_(readCell_(meta, row, ['Kitchen Notes'])),
    assignedCook: asString_(readCell_(meta, row, ['Assigned Cook'])),
  }
}

function validateMealPlanRows_(meta, rows, recipeIndex) {
  const missing = []
  rows.forEach(function(row) {
    const recipeId = asString_(readCell_(meta, row, ['Recipe ID']))
    if (!recipeId || !recipeIndex[recipeId]) {
      missing.push('row ' + row.rowNumber + ' (' + (recipeId || 'blank') + ')')
    }
  })
  if (missing.length > 0) {
    throw new Error('MealPlan references missing RecipeMaster IDs: ' + missing.join(', '))
  }
}

function buildMealPlanSheetRow_(headers, payload) {
  return headers.map(function(header) {
    const normalized = normalizeHeader_(header)
    if (normalized === 'date') return payload.date
    if (normalized === 'day') return payload.day
    if (normalized === 'mealslot') return payload.meal.slot || ''
    if (normalized === 'recipeid') return payload.recipe.id
    if (normalized === 'recipenameauto') return payload.recipe.name
    if (normalized === 'cookscaledfor') return payload.meal.cookScaledFor || payload.recipe.baseServings || 1
    if (normalized === 'muhtasimportion') return getPortion_(payload.meal, 'muhtasim')
    if (normalized === 'adultsportion') return getPortion_(payload.meal, 'adults')
    if (normalized === 'teensportion') return getPortion_(payload.meal, 'teens')
    if (normalized === 'kidsportion') return getPortion_(payload.meal, 'kids')
    if (normalized === 'pickymodifier') return payload.meal.pickyModifier || payload.recipe.pickyModifier || ''
    if (normalized === 'kitchennotes') return payload.meal.kitchenNotes || ''
    if (normalized === 'assignedcook') return payload.meal.assignedCook || ''
    return ''
  })
}

function buildShoppingSheetRow_(headers, item) {
  return headers.map(function(header) {
    const normalized = normalizeHeader_(header)
    if (normalized === 'date') return item.date
    if (normalized === 'ingredient') return item.ingredient
    if (normalized === 'category') return item.category
    if (normalized === 'quantity') return item.quantity
    if (normalized === 'unit') return item.unit
    if (normalized === 'shoppingtag') return item.tag
    if (normalized === 'checked') return item.checked
    if (normalized === 'shopper') return item.shopper
    if (normalized === 'notes') return item.notes
    return ''
  })
}

function filterShoppingRows_(context, date, scopeStart, scopeEnd) {
  return context.rows.map(function(row) {
    const rowDate = normalizeDateInput_(readCell_(context.meta, row, ['Date']))
    return {
      row: row.rowNumber,
      date: rowDate,
      ingredient: asString_(readCell_(context.meta, row, ['Ingredient'])),
      category: asString_(readCell_(context.meta, row, ['Category'])) || 'Other',
      quantity: asString_(readCell_(context.meta, row, ['Quantity'])),
      unit: asString_(readCell_(context.meta, row, ['Unit'])),
      tag: normalizeShoppingTag_(readCell_(context.meta, row, ['Shopping Tag'])),
      checked: asBool_(readCell_(context.meta, row, ['Checked?'])),
      shopper: asString_(readCell_(context.meta, row, ['Shopper'])),
      notes: asString_(readCell_(context.meta, row, ['Notes'])),
    }
  }).filter(function(item) {
    if (date) return item.date === date
    return item.date >= scopeStart && item.date <= scopeEnd
  })
}

function compareMeals_(a, b) {
  const left = SLOT_ORDER[a.slot] || 99
  const right = SLOT_ORDER[b.slot] || 99
  if (left !== right) return left - right
  return String(a.recipeName || '').localeCompare(String(b.recipeName || ''))
}

function compareShoppingRows_(a, b) {
  if (a[0] !== b[0]) return String(a[0]).localeCompare(String(b[0]))
  if (a[2] !== b[2]) return String(a[2]).localeCompare(String(b[2]))
  return String(a[1]).localeCompare(String(b[1]))
}

function rewriteSheetData_(sheet, headers, rows) {
  const lastRow = sheet.getLastRow()
  const lastCol = Math.max(sheet.getLastColumn(), headers.length)
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent()
  }
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows)
  }
}

function getSheetRows_(sheetName, allowMissing) {
  const meta = getSheetMeta_(sheetName, allowMissing)
  if (!meta) return null
  if (meta.sheet.getLastRow() < 2) return { meta: meta, rows: [] }

  const values = meta.sheet.getRange(2, 1, meta.sheet.getLastRow() - 1, meta.sheet.getLastColumn()).getValues()
  const rows = []
  values.forEach(function(rowValues, index) {
    if (rowHasData_(rowValues)) {
      rows.push({ rowNumber: index + 2, values: rowValues })
    }
  })
  return { meta: meta, rows: rows }
}

function getSheetMeta_(sheetName, allowMissing) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName)
  if (!sheet) {
    if (allowMissing) return null
    throw new Error('Missing sheet: ' + sheetName)
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const headerMap = {}
  headers.forEach(function(header, index) {
    headerMap[normalizeHeader_(header)] = index
  })
  return { sheet: sheet, headers: headers, headerMap: headerMap }
}

function getColumnIndex_(meta, aliases, required) {
  for (let i = 0; i < aliases.length; i += 1) {
    const normalized = normalizeHeader_(aliases[i])
    if (normalized in meta.headerMap) return meta.headerMap[normalized] + 1
  }
  if (required) throw new Error('Missing required column: ' + aliases[0])
  return 0
}

function readCell_(meta, row, aliases) {
  const column = getColumnIndex_(meta, aliases, false)
  if (!column) return ''
  return row.values[column - 1]
}

function parseIngredients_(value) {
  const source = asString_(value)
  if (!source) return []
  try {
    const parsed = JSON.parse(source)
    if (Array.isArray(parsed)) {
      return parsed.map(function(item) {
        return { key: asString_(item.key), qty: asNumber_(item.qty), unit: asString_(item.unit) }
      })
    }
  } catch (err) {
    // Fall back to legacy CSV format.
  }

  return source.split(',').map(function(item) {
    const parts = item.trim().split(':')
    return { key: asString_(parts[0]), qty: asNumber_(parts[1]), unit: asString_(parts[2]) }
  }).filter(function(item) {
    return !!item.key
  })
}

function formatQuantity_(quantity, unit) {
  let value = asNumber_(quantity)
  let outputUnit = asString_(unit)
  if (outputUnit === 'g' && value >= 1000) {
    value = value / 1000
    outputUnit = 'kg'
  } else if (outputUnit === 'ml' && value >= 1000) {
    value = value / 1000
    outputUnit = 'L'
  }
  value = roundQuantity_(value)
  return {
    label: outputUnit ? formatNumber_(value) + ' ' + outputUnit : formatNumber_(value),
    unit: outputUnit,
  }
}

function roundQuantity_(value) {
  if (value >= 10) return Math.round(value * 10) / 10
  return Math.round(value * 100) / 100
}

function formatNumber_(value) {
  const text = String(value)
  if (text.indexOf('.') < 0) return text
  return text.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')
}

function splitCsv_(value) {
  return asString_(value).split(',').map(function(item) {
    return item.trim()
  }).filter(function(item) {
    return !!item
  })
}

function getPortion_(meal, key) {
  return meal && meal.portions && meal.portions[key] ? meal.portions[key] : ''
}

function humanizeKey_(value) {
  return asString_(value).replace(/_/g, ' ')
}

function normalizeShoppingTag_(value) {
  return String(value || '').toLowerCase() === 'weekly' ? 'Weekly' : 'Daily'
}

function normalizeHeader_(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function getParam_(event, key, fallbackValue) {
  return event && event.parameter && event.parameter[key] ? event.parameter[key] : fallbackValue
}

function rowHasData_(values) {
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] !== '' && values[index] !== null && values[index] !== undefined) return true
  }
  return false
}

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON)
}

function asString_(value) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  return String(value).trim()
}

function asNumber_(value) {
  const number = Number(value)
  return isNaN(number) ? 0 : number
}

function asBool_(value) {
  if (value === true || value === 1) return true
  const text = String(value || '').toLowerCase()
  return text === 'true' || text === 'yes' || text === '1'
}

function normalizeDateInput_(value, allowBlank) {
  if (!value) {
    if (allowBlank) return ''
    throw new Error('A valid YYYY-MM-DD date is required.')
  }
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  }
  const text = String(value).trim()
  if (!text) {
    if (allowBlank) return ''
    throw new Error('A valid YYYY-MM-DD date is required.')
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const parsed = new Date(text)
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  }
  throw new Error('Invalid date: ' + text)
}

function todayIso_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
}

function getCurrentWeekStart_() {
  return getWeekStartForDate_(todayIso_())
}

function getWeekStartForDate_(date) {
  const value = new Date(date + 'T00:00:00')
  const day = value.getDay()
  const diff = day === 0 ? -6 : 1 - day
  value.setDate(value.getDate() + diff)
  return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd')
}

function addDays_(date, offset) {
  const value = new Date(normalizeDateInput_(date) + 'T00:00:00')
  value.setDate(value.getDate() + offset)
  return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd')
}

function getDayName_(date) {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const value = new Date(normalizeDateInput_(date) + 'T00:00:00')
  return names[value.getDay()]
}

function toMinutes_(value) {
  if (!value) return 9999
  const match = String(value).match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return 9999
  let hour = Number(match[1])
  const minute = Number(match[2])
  const meridiem = match[3].toUpperCase()
  if (meridiem === 'PM' && hour !== 12) hour += 12
  if (meridiem === 'AM' && hour === 12) hour = 0
  return hour * 60 + minute
}
