# Family Meal Planner — Setup Guide

## What you're getting

| File | Purpose |
|------|---------|
| `MealPlanner_Master.xlsx` | The **master control sheet** — upload to Google Sheets. This is your admin interface. |
| `MealPlanner_API.gs` | The **Apps Script API** — paste into your Google Sheet's script editor. Powers the PWA. |

## Architecture

```
YOU (admin)                    FAMILY (viewers)
    │                               │
    ▼                               ▼
Google Sheets ──► Apps Script API ──► PWA (read-only)
(edit here)       (auto-serves)      (view here)
```

**You control everything from Google Sheets. The family only sees the PWA.**

---

## Step-by-step setup

### 1. Upload the Master Sheet to Google Sheets

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. File → Import → Upload → select `MealPlanner_Master.xlsx`
4. Choose **"Replace spreadsheet"** when prompted
5. Rename the spreadsheet to "Family Meal Planner" (or whatever you prefer)

### 2. Review the sheets

The workbook has 7 tabs:

| Tab | Color | What it does |
|-----|-------|-------------|
| **Instructions** | Purple | How-to guide (this info) |
| **Recipes** | Green | Master recipe database — 20 recipes pre-loaded from your diet plan |
| **MealPlan** | Amber | Weekly calendar — recipe assignments for each meal slot × each day |
| **FamilyProfiles** | Purple | 7 family members with dietary groups and portion multipliers |
| **PickyEaterNotes** | Pink | Daughter's food preferences tracked systematically |
| **IngredientDB** | Blue | Master ingredient list with categories, units, shopping tags |
| **ShoppingList** | Coral | Generated/manual shopping list with daily/weekly tags |

### 3. Customize FamilyProfiles

Open the **FamilyProfiles** tab and update:
- Real names (replace "Adult 2", "Adult 3", "Teen 1", etc.)
- Ages
- Any specific restrictions or allergies
- The daughter's row (F007) has detailed picky-eater notes

### 4. Install the Apps Script API

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code in `Code.gs`
3. Copy-paste the entire contents of `MealPlanner_API.gs`
4. Click **Save** (Ctrl+S)
5. Click **Deploy → New deployment**
6. Type: **Web app**
7. Execute as: **Me**
8. Who has access: **Anyone** (so the PWA can call it without auth)
9. Click **Deploy**
10. **Copy the Web App URL** — you'll need this for the PWA

### 5. Test the API

Open a browser and go to:
```
YOUR_WEB_APP_URL?action=ping
```
You should see: `{"status":"ok","message":"Meal Planner API is running",...}`

Try other endpoints:
```
?action=getRecipes
?action=getFamily
?action=getMealPlan&weekStart=2026-03-23
?action=getShopping
?action=getKitchenDay&date=2026-03-23
?action=getPickyNotes&memberId=F007
?action=getDashboard
```

---

## How to use the Master Sheet (your admin workflow)

### Weekly planning (Sunday evening, ~15 minutes)

1. Open **MealPlan** tab
2. Fill in the next week's rows:
   - Date, Day, Meal Slot (dropdowns)
   - Recipe ID (type R001, R002, etc. — refer to Recipes tab)
   - Recipe Name will auto-populate once we set up the formula
   - Fill in portion notes and picky modifiers
   - Assign cooks
3. The PWA calendar view updates automatically

### Adding a new recipe

1. Open **Recipes** tab
2. Add a new row at the bottom
3. Use the next Recipe ID (R021, R022...)
4. Fill in all columns — use the dropdowns for Category, Difficulty, Kid Friendly
5. Ingredients format: `ingredient_key:quantity:unit, ingredient_key:quantity:unit`
   - The ingredient_key must match a key in the **IngredientDB** tab
   - Example: `chicken_breast:120:g, lau:2:cup, tomato:1:pc`

### Generating a shopping list

**Option A (Manual):** Open **ShoppingList** tab, add items manually. Tag each as Daily or Weekly.

**Option B (Auto-generate):** Call the API:
```
POST your_api_url
Body: {"action": "generateShopping", "weekStart": "2026-03-30"}
```
This reads the MealPlan for that week, aggregates all ingredients, and populates the ShoppingList tab.

### Tracking picky eater progress

Open **PickyEaterNotes** tab. Update as you learn:
- Changed from "Refuses" to "Dislikes"? Update the Status.
- Found a new workaround? Update the Notes column.
- Tested a new food? Add a row with "Unsure" and the date.

---

## API endpoints reference

| Method | Endpoint | Parameters | Returns |
|--------|----------|-----------|---------|
| GET | `?action=ping` | — | API status |
| GET | `?action=getRecipes` | `category`, `kidFriendly`, `tag` | All/filtered recipes |
| GET | `?action=getRecipe` | `id` (e.g., R001) | Single recipe detail |
| GET | `?action=getMealPlan` | `weekStart` (YYYY-MM-DD) | Week's meal plan grouped by day |
| GET | `?action=getMealPlanDay` | `date` (YYYY-MM-DD) | Single day's meals |
| GET | `?action=getFamily` | — | All family members |
| GET | `?action=getShopping` | `date`, `tag` (Daily/Weekly) | Shopping list with progress |
| GET | `?action=getPickyNotes` | `memberId` (e.g., F007) | Picky eater preferences |
| GET | `?action=getKitchenDay` | `date` | Kitchen timeline for cooks |
| GET | `?action=getDashboard` | — | Admin overview stats |
| POST | `toggleShopping` | `row`, `checked` | Check/uncheck shopping item |
| POST | `generateShopping` | `weekStart` | Auto-generate shopping list from meal plan |

---

## Next step: PWA frontend

Once the API is live, we'll build the React PWA that:
- Reads from this API
- Displays the 4-tab interface (Calendar, Shopping, Recipes, Kitchen)
- Is installable on Android phones
- Hosted free on GitHub Pages

The PWA is 100% read-only for family. All control stays in your Google Sheet.

---

## Tips

- **Don't rename Recipe IDs** after they're used in MealPlan — it breaks the link
- **Use filters** in Google Sheets (the auto-filter is already set up on most tabs)
- **Freeze panes** are set so headers stay visible while scrolling
- **Data validation** (dropdowns) prevents typos in Category, Difficulty, etc.
- **Conditional formatting** on ShoppingList highlights checked items in green
- **Backup**: Google Sheets auto-saves and has version history (File → Version history)
