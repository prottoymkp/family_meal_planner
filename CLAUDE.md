# CLAUDE.md — Family Meal Planner PWA

## Project overview

A React PWA for a Bangladeshi family of 7 (3 adults, 2 teens, 2 kids aged 6). One adult is diabetic with NAFLD — strict diet control. One child (daughter) is a picky eater with tracked preferences. The app is **read-only for family members** — all data is controlled via a Google Sheets master sheet and served through a Google Apps Script REST API.

**Tech stack:** React 18 + Vite + Tailwind CSS + PWA (service worker). Hosted on GitHub Pages.

**The app has 4 tabs:**
1. **Calendar** — Weekly meal plan with per-person portion badges and picky-eater modifiers
2. **Shopping** — Checkable grocery list with daily/weekly tags, filtering, and progress bar
3. **Recipes** — Browsable recipe collection with dietary tags, macros, and portion scaling
4. **Kitchen** — Daily timeline for kitchen staff with prep assignments and picky-eater alerts

## Architecture

```
Google Sheets (admin edits) → Apps Script API (REST) → This PWA (read-only viewer)
```

The API base URL is configured in `src/utils/api.js`. The user will set their own deployed Apps Script URL.

## API endpoints the app consumes

All GET requests to the Apps Script web app URL:

| Action | Params | Used by |
|--------|--------|---------|
| `getMealPlan` | `weekStart=YYYY-MM-DD` | Calendar page |
| `getMealPlanDay` | `date=YYYY-MM-DD` | Calendar page (day detail) |
| `getRecipes` | `category`, `kidFriendly`, `tag` | Recipes page |
| `getRecipe` | `id=R001` | Recipe detail modal |
| `getShopping` | `date`, `tag` (Daily/Weekly) | Shopping page |
| `getFamily` | — | Portion scaling, profile badges |
| `getKitchenDay` | `date=YYYY-MM-DD` | Kitchen page |
| `getPickyNotes` | `memberId=F007` | Picky alerts in Kitchen/Calendar |
| `getDashboard` | — | Home/summary stats |

POST endpoints:
| Action | Body | Used by |
|--------|------|---------|
| `toggleShopping` | `{row, checked}` | Shopping checkboxes (only interactive feature) |

## API response shapes

### getMealPlan response
```json
{
  "weekStart": "2026-03-23",
  "days": [
    {
      "date": "2026-03-23",
      "day": "Monday",
      "meals": [
        {
          "slot": "Breakfast",
          "recipeId": "R015",
          "recipeName": "Egg omelette + chapati",
          "cookScaledFor": 7,
          "portions": {
            "muhtasim": "1 egg + 1 small chapati (22g carb)",
            "adults": "Standard, slightly relaxed",
            "teens": "Larger portions, extra roti/rice OK",
            "kids": "Mild spice, see picky modifier"
          },
          "pickyModifier": "Daughter: paratha + jam, banana, milk",
          "kitchenNotes": "",
          "assignedCook": "Cook A"
        }
      ]
    }
  ]
}
```

### getShopping response
```json
{
  "total": 15,
  "checked": 5,
  "progress": 33,
  "categories": {
    "Protein": [
      {
        "row": 2,
        "ingredient": "Chicken breast",
        "category": "Protein",
        "quantity": "500g",
        "unit": "g",
        "tag": "Daily",
        "checked": false,
        "shopper": "Shopper B",
        "notes": "For dinner"
      }
    ],
    "Vegetables": [...]
  }
}
```

### getRecipes response
```json
{
  "count": 20,
  "recipes": [
    {
      "id": "R001",
      "name": "Vegetable dal khichuri",
      "category": "Dinner",
      "cuisine": "Bangladeshi",
      "prepTime": 10,
      "cookTime": 25,
      "difficulty": "Easy",
      "tags": ["diabetic-safe", "nafld-friendly"],
      "kidFriendly": true,
      "pickyOk": true,
      "calories": 320,
      "carbs": 38,
      "protein": 14,
      "fat": 8,
      "fiber": 9,
      "baseServings": 1,
      "ingredients": [{"key": "brown_rice", "qty": 0.25, "unit": "cup"}],
      "method": "1. Soak rice/dal...",
      "pickyModifier": "Kids: serve plain...",
      "notes": "One-pot meal."
    }
  ]
}
```

### getKitchenDay response
```json
{
  "date": "2026-03-23",
  "day": "Monday",
  "peopleToFeed": 7,
  "mealsToday": 4,
  "timeline": [
    {
      "prepTime": "6:00 AM",
      "serveTime": "6:30 AM",
      "slot": "Breakfast",
      "recipe": "Egg omelette + chapati",
      "recipeId": "R015",
      "scaledFor": 7,
      "assignedCook": "Cook A",
      "portions": {...},
      "pickyModifier": "Daughter: paratha + jam, banana, milk",
      "kitchenNotes": ""
    }
  ],
  "pickyAlerts": ["Bitter gourd (korola)", "Strong fish (hilsa)"]
}
```

### getFamily response
```json
{
  "count": 7,
  "members": [
    {
      "id": "F001",
      "name": "Muhtasim",
      "age": 35,
      "gender": "M",
      "group": "Diabetic",
      "portionMultiplier": 1.0,
      "riceLimit": 0.5,
      "calorieTarget": 1800,
      "restrictions": "Low carb, low sat-fat, no sugar, NAFLD diet",
      "notes": "HbA1c 7.6%, NAFLD Grade II."
    }
  ]
}
```

## Design system

### Colors (semantic, by dietary group)
- **Diabetic (Muhtasim):** Purple — bg `#EEEDFE`, text `#3C3489` (dark: bg `#26215C`, text `#CECBF6`)
- **General adult:** Teal — bg `#E1F5EE`, text `#085041` (dark: bg `#04342C`, text `#9FE1CB`)
- **Teen:** Amber — bg `#FAEEDA`, text `#633806` (dark: bg `#412402`, text `#FAC775`)
- **Kid:** Coral — bg `#FAECE7`, text `#712B13` (dark: bg `#4A1B0C`, text `#F5C4B3`)
- **Picky alert:** Pink — bg `#FBEAF0`, text `#72243E` (dark: bg `#4B1528`, text `#F4C0D1`)
- **Daily shopping tag:** Blue — bg `#E6F1FB`, text `#0C447C`
- **Weekly shopping tag:** Amber — bg `#FAEEDA`, text `#633806`
- **Primary accent:** `#0F6E56` (teal-green, used for active nav, checked items, progress)

### Typography
- Font: system default (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- Headings: 500 weight, 18px
- Body: 400 weight, 14px
- Captions/badges: 11-12px

### Components
- **Badge/pill:** rounded-full, colored bg per group, 11px font, px-2 py-0.5
- **Card:** white bg, rounded-xl, border 0.5px border-gray-200, p-3
- **Meal card:** card with meal name (14px bold), meta line (12px gray), badge row, picky modifier line (pink left border)
- **Check item:** flex row with custom checkbox (20px, rounded-md, teal when checked), item name, tag badge, quantity
- **Day chip:** rounded-lg, 52px min-width, active state = teal bg + white text
- **Filter pill:** rounded-full, toggleable, active = teal bg
- **Nav bar:** fixed bottom, 4 icons + labels, active = teal color
- **Kitchen task card:** flex with time column (teal) + detail column + assignee badge
- **Progress bar:** 4px height, teal fill, rounded

### Layout
- Mobile-first, max-width 480px centered
- Bottom nav 60px fixed
- Content area padded 16px horizontal
- No horizontal scroll

## File structure

```
src/
├── main.jsx              # Entry point, render App
├── App.jsx               # Router + layout shell (top bar + bottom nav + screen switcher)
├── index.css             # Tailwind imports + custom CSS variables + badge/component styles
├── components/
│   ├── BottomNav.jsx     # 4-tab navigation (Calendar, Shopping, Recipes, Kitchen)
│   ├── TopBar.jsx        # Title + subtitle + family badge row
│   ├── DayStrip.jsx      # Horizontal scrolling day chips (Mon-Sun)
│   ├── MealCard.jsx      # Single meal slot card with portions + picky modifier
│   ├── CheckItem.jsx     # Shopping list item with checkbox, tag badge, quantity
│   ├── RecipeCard.jsx    # Recipe list item with thumb, tags, macros
│   ├── RecipeDetail.jsx  # Expanded recipe view (modal/drawer) with ingredients + method + portion grid
│   ├── KitchenTask.jsx   # Timeline task item with time, title, assignee
│   ├── Badge.jsx         # Reusable colored badge/pill component
│   ├── FilterRow.jsx     # Horizontal filter pills (All, Daily, Weekly / All, Dinner, Kid-friendly)
│   ├── ProgressBar.jsx   # Shopping progress bar with label
│   └── PortionGrid.jsx   # 2x2 grid showing per-group portions for a meal
├── pages/
│   ├── CalendarPage.jsx  # Weekly calendar with day strip + meal cards for selected day
│   ├── ShoppingPage.jsx  # Shopping list grouped by category with filters + progress + checkboxes
│   ├── RecipesPage.jsx   # Recipe browser with filters + recipe cards (click → detail)
│   └── KitchenPage.jsx   # Today's kitchen timeline with stats + task cards + picky alerts
├── hooks/
│   └── useApi.js         # Custom hook: fetch from API with loading/error states + caching
├── utils/
│   ├── api.js            # API base URL config + fetch wrapper functions for each endpoint
│   ├── dates.js          # Date helpers (getWeekStart, formatDate, getDayName, etc.)
│   └── constants.js      # Dietary group colors, meal slot times, badge color map
└── assets/
    └── icons.jsx         # SVG icon components for nav (calendar, bag, book, pot)
```

## Implementation notes

### State management
- Use React useState + useEffect. No Redux needed — it's a simple read-only viewer.
- `useApi` hook handles loading, error, data states with a simple fetch wrapper.
- Cache API responses in-memory for the session (avoid re-fetching on tab switches).
- Only the shopping checkbox is interactive (POST to toggleShopping).

### Offline support
- Service worker caches the app shell (HTML, JS, CSS).
- API responses are NOT cached offline (data must be fresh from Sheets).
- Show a "You're offline" banner if fetch fails, with last-fetched timestamp.

### PWA manifest
- Name: "Meal Planner"
- Short name: "Meals"
- Theme color: `#0F6E56`
- Background: `#FFFFFF`
- Display: standalone
- Icons: generate simple colored icons (green circle with plate/utensil silhouette)

### Key UX details

1. **Calendar page:**
   - Default to today's date on the day strip
   - Show all 4 meal slots (Breakfast, Lunch, Snack, Dinner) for selected day
   - Each meal card shows: recipe name, calories/carbs/protein meta line, dietary group badges with portion text, pink-bordered picky modifier line
   - Portion grid (2x2) shows per-group portions in the dinner card

2. **Shopping page:**
   - Filter row: All / Daily fresh / Weekly bulk
   - Items grouped by category (Protein, Vegetables, Grains, Fruits, etc.)
   - Each item: checkbox + name + tag badge (daily=blue, weekly=amber) + quantity
   - Checked items get strikethrough + move to bottom of their group
   - Progress bar at bottom: "X of Y items checked"
   - Checkbox taps POST to API to persist in Google Sheets

3. **Recipes page:**
   - Filter row: All / Dinner / Kid-friendly / Under 30 min
   - Recipe cards: thumbnail placeholder + name + description + tag badges + macro stats
   - Click card → expand to RecipeDetail showing ingredients list, method steps, portion grid for all 4 dietary groups, and picky modifier note

4. **Kitchen page:**
   - Stats row: "7 people to feed" + "4 meals today"
   - Timeline of task cards sorted by prep time
   - Each task: time (teal), title, description, assignee badge
   - Highlighted "Picky eater" alert card at bottom with daughter's refuses list and backup options

### Error handling
- If API URL is not configured (empty string), show a setup screen: "Enter your Apps Script URL"
- Store the URL in localStorage after first entry
- Show loading skeletons while fetching
- Show friendly error message if API returns error

### Demo/fallback mode
- Include hardcoded sample data in `src/utils/sampleData.js` matching the API response shapes above
- If API is unreachable, fall back to sample data with a yellow banner: "Showing sample data — connect your Google Sheet for live data"
- This lets the user see the app immediately before setting up the API

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server at localhost:5173
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
npm run deploy       # Deploy to GitHub Pages (gh-pages branch)
```

## GitHub Pages deployment

The `vite.config.js` has `base` set to the repo name. After `npm run build`:
1. The `dist/` folder contains the deployable app
2. `npm run deploy` uses `gh-pages` package to push `dist/` to the `gh-pages` branch
3. Enable GitHub Pages in repo settings → Source: `gh-pages` branch

Or use GitHub Actions (workflow file included at `.github/workflows/deploy.yml`).
