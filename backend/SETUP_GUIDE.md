# Family Meal Planner Setup

## Files

| File | Purpose |
|------|---------|
| `MealPlanner_Master.xlsx` | Workbook template to upload into Google Sheets |
| `MealPlanner_API.gs` | Apps Script backend for the PWA and widget |

## Data model

- `RecipeMaster` is the only canonical recipe source.
- `MealPlan` stores dated meal rows. Reusing the same `Recipe ID` on multiple dates is expected.
- `ShoppingList` is generated from `MealPlan -> RecipeMaster -> IngredientDB`.
- `Recipes` can stay in the workbook as legacy reference, but the backend does not read from it.

## Setup

1. Upload `MealPlanner_Master.xlsx` into a new Google Sheet.
2. Open `Extensions -> Apps Script`.
3. Replace the default script with `MealPlanner_API.gs`.
4. Deploy it as a Web App:
   - Execute as: `Me`
   - Who has access: `Anyone`
5. Copy the Web App URL.
6. Open the app, paste the URL into Settings, and run the connection test.

## Supported endpoints

### GET

- `?action=ping`
- `?action=getRecipes`
- `?action=getRecipe&id=R001`
- `?action=getMealPlan&weekStart=2026-03-30`
- `?action=getMealPlanDay&date=2026-03-31`
- `?action=getShopping&weekStart=2026-03-30`
- `?action=getShopping&date=2026-03-31`
- `?action=getShopping&weekStart=2026-03-30&tag=Weekly`
- `?action=getFamily`
- `?action=getKitchenDay&date=2026-03-31`
- `?action=getPickyNotes&memberId=F007`
- `?action=getDashboard`
- `?action=getNextWeekPlan&weekStart=2026-04-06`

### POST

- `{"action":"toggleShopping","row":12,"checked":true}`
- `{"action":"generateShopping","weekStart":"2026-03-30"}`
- `{"action":"saveWeekPlan","weekStart":"2026-04-06","days":[...]}`

## Operational notes

- The backend validates every `MealPlan` recipe reference against `RecipeMaster`. If a row points to a missing recipe ID, requests fail fast with the offending row numbers.
- `getShopping` is week-scoped by default. Weekly bulk items are written to the day before the planning week starts.
- Regenerating shopping rewrites only the selected week window in `ShoppingList`; other weeks are preserved.
- Saving a planner week also regenerates that week’s shopping list.

## Recommended workflow

1. Maintain recipes in `RecipeMaster`.
2. Use the app planner or the `MealPlan` sheet to set next week’s meals.
3. Let the backend generate `ShoppingList` from those rows.
4. Use the app for read-only daily viewing plus checklist updates.
