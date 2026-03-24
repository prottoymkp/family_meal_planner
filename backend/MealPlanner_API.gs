/**
 * FAMILY MEAL PLANNER — Apps Script API
 * 
 * SETUP:
 * 1. Open your Google Sheet (the uploaded Master template)
 * 2. Go to Extensions > Apps Script
 * 3. Replace the default Code.gs content with this entire file
 * 4. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL — that's your API endpoint
 * 
 * The PWA calls this API with ?action=xxx to get data.
 * All data comes from the sheets — you edit sheets, app updates.
 */

// ============================================================
// CONFIG
// ============================================================
const SHEET_NAMES = {
  recipes: 'Recipes',
  mealPlan: 'MealPlan',
  family: 'FamilyProfiles',
  shopping: 'ShoppingList',
  picky: 'PickyEaterNotes',
  ingredients: 'IngredientDB'
};

// ============================================================
// MAIN ENTRY POINT
// ============================================================
function doGet(e) {
  const action = e.parameter.action || 'ping';
  let result;

  try {
    switch (action) {
      case 'ping':
        result = { status: 'ok', message: 'Meal Planner API is running', timestamp: new Date().toISOString() };
        break;
      case 'getRecipes':
        result = getRecipes(e.parameter);
        break;
      case 'getRecipe':
        result = getRecipeById(e.parameter.id);
        break;
      case 'getMealPlan':
        result = getMealPlan(e.parameter);
        break;
      case 'getMealPlanDay':
        result = getMealPlanDay(e.parameter.date);
        break;
      case 'getFamily':
        result = getFamily();
        break;
      case 'getShopping':
        result = getShopping(e.parameter);
        break;
      case 'getPickyNotes':
        result = getPickyNotes(e.parameter.memberId);
        break;
      case 'getKitchenDay':
        result = getKitchenDay(e.parameter.date);
        break;
      case 'getDashboard':
        result = getDashboard();
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { error: err.message, stack: err.stack };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  let result;

  try {
    switch (action) {
      case 'toggleShopping':
        result = toggleShoppingItem(body.row, body.checked);
        break;
      case 'generateShopping':
        result = generateShoppingList(body.weekStart);
        break;
      default:
        result = { error: 'Unknown POST action: ' + action };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// HELPER: Read sheet into array of objects
// ============================================================
function sheetToObjects(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(sheetName);
  if (!ws) return [];

  const data = ws.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => toCamelCase(String(h)));
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    let hasData = false;
    for (let j = 0; j < headers.length; j++) {
      let val = data[i][j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      row[headers[j]] = val;
      if (val !== '' && val !== null && val !== undefined) hasData = true;
    }
    row._row = i + 1; // 1-indexed sheet row for updates
    if (hasData) rows.push(row);
  }
  return rows;
}

function toCamelCase(str) {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// ============================================================
// GET RECIPES
// ============================================================
function getRecipes(params) {
  let recipes = sheetToObjects(SHEET_NAMES.recipes);

  // Filter by category
  if (params && params.category) {
    recipes = recipes.filter(r => r.category === params.category);
  }

  // Filter by kid-friendly
  if (params && params.kidFriendly === 'true') {
    recipes = recipes.filter(r => r.kidFriendly === 'Yes');
  }

  // Filter by dietary tag
  if (params && params.tag) {
    recipes = recipes.filter(r => r.dietaryTags && r.dietaryTags.includes(params.tag));
  }

  return {
    count: recipes.length,
    recipes: recipes.map(r => ({
      id: r.recipeId,
      name: r.recipeName,
      category: r.category,
      cuisine: r.cuisine,
      prepTime: r.prepTimeMin,
      cookTime: r.cookTimeMin,
      difficulty: r.difficulty,
      tags: r.dietaryTags ? r.dietaryTags.split(',').map(t => t.trim()) : [],
      kidFriendly: r.kidFriendly === 'Yes',
      pickyOk: r.pickyEaterOk === 'Yes',
      calories: r.caloriesServing,
      carbs: r.carbsG,
      protein: r.proteinG,
      fat: r.fatG,
      fiber: r.fiberG,
      baseServings: r.baseServings,
      ingredients: parseIngredients(r.ingredientsNameQtyUnit),
      method: r.methodSteps,
      pickyModifier: r.pickyModifier,
      notes: r.notes
    }))
  };
}

function getRecipeById(id) {
  const all = getRecipes({});
  const recipe = all.recipes.find(r => r.id === id);
  if (!recipe) return { error: 'Recipe not found: ' + id };
  return recipe;
}

function parseIngredients(str) {
  if (!str) return [];
  return str.split(',').map(item => {
    const parts = item.trim().split(':');
    return {
      key: parts[0] || '',
      qty: parseFloat(parts[1]) || 0,
      unit: parts[2] || ''
    };
  });
}

// ============================================================
// GET MEAL PLAN
// ============================================================
function getMealPlan(params) {
  let plan = sheetToObjects(SHEET_NAMES.mealPlan);

  // Filter by week (weekStart = 'YYYY-MM-DD')
  if (params && params.weekStart) {
    const start = new Date(params.weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    plan = plan.filter(p => {
      const d = new Date(p.date);
      return d >= start && d < end;
    });
  }

  // Group by date
  const grouped = {};
  plan.forEach(p => {
    const date = p.date;
    if (!grouped[date]) {
      grouped[date] = { date: date, day: p.day, meals: [] };
    }
    grouped[date].meals.push({
      slot: p.mealSlot,
      recipeId: p.recipeId,
      recipeName: p.recipeNameAuto,
      cookScaledFor: p.cookScaledFor,
      portions: {
        muhtasim: p.muhtasimPortion,
        adults: p.adultsPortion,
        teens: p.teensPortion,
        kids: p.kidsPortion
      },
      pickyModifier: p.pickyModifier,
      kitchenNotes: p.kitchenNotes,
      assignedCook: p.assignedCook
    });
  });

  return {
    weekStart: params ? params.weekStart : null,
    days: Object.values(grouped)
  };
}

function getMealPlanDay(date) {
  const all = getMealPlan({ weekStart: null });
  const day = all.days.find(d => d.date === date);
  if (!day) return { error: 'No meal plan for: ' + date, date: date };
  return day;
}

// ============================================================
// GET FAMILY PROFILES
// ============================================================
function getFamily() {
  const members = sheetToObjects(SHEET_NAMES.family);
  return {
    count: members.length,
    members: members.map(m => ({
      id: m.memberId,
      name: m.name,
      age: m.age,
      gender: m.gender,
      group: m.dietaryGroup,
      portionMultiplier: m.portionMultiplier,
      riceLimit: m.riceLimitCupmeal,
      calorieTarget: m.dailyCalorieTarget,
      restrictions: m.restrictions,
      allergies: m.allergies,
      preferences: m.preferences,
      notes: m.notes
    }))
  };
}

// ============================================================
// GET SHOPPING LIST
// ============================================================
function getShopping(params) {
  let items = sheetToObjects(SHEET_NAMES.shopping);

  if (params && params.date) {
    items = items.filter(i => i.date === params.date);
  }

  if (params && params.tag) {
    items = items.filter(i => i.shoppingTag === params.tag);
  }

  // Group by category
  const grouped = {};
  items.forEach(item => {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({
      row: item._row,
      ingredient: item.ingredient,
      category: cat,
      quantity: item.quantity,
      unit: item.unit,
      tag: item.shoppingTag,
      checked: item.checked === 'Yes',
      shopper: item.shopper,
      notes: item.notes
    });
  });

  const total = items.length;
  const checked = items.filter(i => i.checked === 'Yes').length;

  return {
    total: total,
    checked: checked,
    progress: total > 0 ? Math.round((checked / total) * 100) : 0,
    categories: grouped
  };
}

// ============================================================
// TOGGLE SHOPPING ITEM (POST)
// ============================================================
function toggleShoppingItem(rowNum, checked) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(SHEET_NAMES.shopping);
  // Column G = Checked?
  ws.getRange(rowNum, 7).setValue(checked ? 'Yes' : 'No');
  return { success: true, row: rowNum, checked: checked };
}

// ============================================================
// GET PICKY EATER NOTES
// ============================================================
function getPickyNotes(memberId) {
  let notes = sheetToObjects(SHEET_NAMES.picky);

  if (memberId) {
    notes = notes.filter(n => n.memberId === memberId);
  }

  // Group by status
  const loves = notes.filter(n => n.status === 'Loves');
  const likes = notes.filter(n => n.status === 'Likes');
  const refuses = notes.filter(n => n.status === 'Refuses');
  const dislikes = notes.filter(n => n.status === 'Dislikes');
  const unsure = notes.filter(n => n.status === 'Unsure');

  return {
    memberId: memberId || 'all',
    summary: {
      loves: loves.map(n => n.foodItem),
      refuses: refuses.map(n => n.foodItem),
      dislikes: dislikes.map(n => n.foodItem),
      unsure: unsure.map(n => n.foodItem)
    },
    details: notes.map(n => ({
      food: n.foodItem,
      status: n.status,
      workaround: n.notesWorkaround,
      confidence: n.confidence
    }))
  };
}

// ============================================================
// GET KITCHEN DAY (combined view for cook staff)
// ============================================================
function getKitchenDay(date) {
  if (!date) {
    date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  const dayPlan = getMealPlanDay(date);
  if (dayPlan.error) return dayPlan;

  const family = getFamily();
  const pickyNotes = getPickyNotes('F007'); // Daughter's notes

  // Build kitchen timeline
  const timeline = [];
  const slotTimes = {
    'Breakfast': { prep: '6:00 AM', serve: '6:30 AM' },
    'Lunch': { prep: '11:30 AM', serve: '1:00 PM' },
    'Snack': { prep: '4:30 PM', serve: '5:00 PM' },
    'Dinner': { prep: '7:30 PM', serve: '9:30 PM' }
  };

  dayPlan.meals.forEach(meal => {
    const times = slotTimes[meal.slot] || { prep: 'TBD', serve: 'TBD' };
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
      kitchenNotes: meal.kitchenNotes
    });
  });

  // Add shopping run task
  timeline.splice(1, 0, {
    prepTime: '10:00 AM',
    slot: 'Shopping',
    recipe: 'Daily market run',
    assignedCook: 'Shopper B',
    kitchenNotes: 'Buy fresh items for today + tomorrow'
  });

  return {
    date: date,
    day: dayPlan.day,
    peopleToFeed: family.count,
    mealsToday: dayPlan.meals.length,
    timeline: timeline,
    pickyAlerts: pickyNotes.summary.refuses
  };
}

// ============================================================
// DASHBOARD (overview for admin)
// ============================================================
function getDashboard() {
  const recipes = sheetToObjects(SHEET_NAMES.recipes);
  const plan = sheetToObjects(SHEET_NAMES.mealPlan);
  const family = sheetToObjects(SHEET_NAMES.family);
  const shopping = sheetToObjects(SHEET_NAMES.shopping);

  const thisWeek = plan.filter(p => {
    const d = new Date(p.date);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return d >= weekStart && d < weekEnd;
  });

  return {
    totalRecipes: recipes.length,
    familySize: family.length,
    thisWeekMeals: thisWeek.length,
    shoppingItems: shopping.length,
    shoppingChecked: shopping.filter(s => s.checked === 'Yes').length,
    recipesByCategory: {
      breakfast: recipes.filter(r => r.category === 'Breakfast').length,
      lunch: recipes.filter(r => r.category === 'Lunch').length,
      dinner: recipes.filter(r => r.category === 'Dinner').length,
      snack: recipes.filter(r => r.category === 'Snack').length
    },
    kidFriendlyRecipes: recipes.filter(r => r.kidFriendly === 'Yes').length
  };
}

// ============================================================
// GENERATE SHOPPING LIST (from MealPlan)
// ============================================================
function generateShoppingList(weekStart) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const plan = getMealPlan({ weekStart: weekStart });
  const ingredientDB = sheetToObjects(SHEET_NAMES.ingredients);
  const family = getFamily();

  // Aggregate ingredients across all meals
  const agg = {};

  plan.days.forEach(day => {
    day.meals.forEach(meal => {
      const recipe = getRecipeById(meal.recipeId);
      if (recipe.error || !recipe.ingredients) return;

      const scale = meal.cookScaledFor || family.count;

      recipe.ingredients.forEach(ing => {
        const key = ing.key;
        if (!agg[key]) {
          // Look up ingredient info from DB
          const dbEntry = ingredientDB.find(i => i.ingredientKey === key);
          agg[key] = {
            name: dbEntry ? dbEntry.displayName : key,
            category: dbEntry ? dbEntry.category : 'Other',
            unit: ing.unit || (dbEntry ? dbEntry.defaultUnit : ''),
            tag: dbEntry ? dbEntry.shoppingTag : 'Daily',
            totalQty: 0
          };
        }
        agg[key].totalQty += ing.qty * scale;
      });
    });
  });

  // Write to ShoppingList sheet
  const ws = ss.getSheetByName(SHEET_NAMES.shopping);
  // Clear existing data (keep header)
  const lastRow = ws.getLastRow();
  if (lastRow > 1) {
    ws.getRange(2, 1, lastRow - 1, 9).clearContent();
  }

  // Write aggregated items
  let row = 2;
  Object.keys(agg).sort((a, b) => agg[a].category.localeCompare(agg[b].category)).forEach(key => {
    const item = agg[key];
    const qty = Math.ceil(item.totalQty * 10) / 10; // Round up
    ws.getRange(row, 1).setValue(weekStart);
    ws.getRange(row, 2).setValue(item.name);
    ws.getRange(row, 3).setValue(item.category);
    ws.getRange(row, 4).setValue(formatQuantity(qty, item.unit));
    ws.getRange(row, 5).setValue(item.unit);
    ws.getRange(row, 6).setValue(item.tag);
    ws.getRange(row, 7).setValue('No');
    ws.getRange(row, 8).setValue(item.tag === 'Daily' ? 'Shopper B' : 'Shopper A');
    row++;
  });

  return {
    success: true,
    itemsGenerated: Object.keys(agg).length,
    weekStart: weekStart
  };
}

function formatQuantity(qty, unit) {
  if (unit === 'g' && qty >= 1000) return (qty / 1000).toFixed(1) + ' kg';
  if (unit === 'ml' && qty >= 1000) return (qty / 1000).toFixed(1) + ' L';
  return qty + ' ' + unit;
}
