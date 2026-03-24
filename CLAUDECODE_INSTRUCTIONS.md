# Claude Code — Implementation Steps

This document tells you exactly what to do with the project package.

## Prerequisites
- Node.js 18+ installed
- Git installed
- A GitHub account with a repo created (e.g., `meal-planner`)

## Step 1: Unzip and initialize

```bash
# Unzip the package
unzip meal-planner-pwa.zip
cd meal-planner-pwa

# Install dependencies
npm install

# Test locally
npm run dev
# Open http://localhost:5173/meal-planner/ in your browser
```

The app will launch in **demo mode** with sample data. You'll see all 4 tabs working.

## Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Family Meal Planner PWA"
git remote add origin https://github.com/YOUR_USERNAME/meal-planner.git
git branch -M main
git push -u origin main
```

## Step 3: Enable GitHub Pages

Two options:

### Option A: GitHub Actions (recommended, already set up)
1. Go to repo → Settings → Pages
2. Source: **GitHub Actions**
3. The workflow at `.github/workflows/deploy.yml` auto-deploys on every push to `main`
4. Your app will be at: `https://YOUR_USERNAME.github.io/meal-planner/`

### Option B: Manual deploy with gh-pages
```bash
npm run build
npm run deploy
```
Then in Settings → Pages → Source: `gh-pages` branch.

## Step 4: Set up the Google Sheets backend

1. Upload `MealPlanner_Master.xlsx` (from the earlier delivery) to Google Sheets
2. Go to Extensions → Apps Script
3. Paste the contents of `MealPlanner_API.gs` (from the earlier delivery)
4. Deploy → New deployment → Web app
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the Web App URL

## Step 5: Connect the PWA to your Sheet

1. Open the PWA in your browser
2. Click the gear icon (top right)
3. Paste the Apps Script Web App URL
4. Click "Connect & test"
5. If you see "Connected!" — you're done. The app now reads live data from your Sheet.

## Step 6: Customize the repo name (if different)

If your repo is NOT named `meal-planner`, update the base path:

Open `vite.config.js` and change:
```js
base: '/meal-planner/',
```
to:
```js
base: '/YOUR-REPO-NAME/',
```

---

## Using Claude Code for modifications

Once the project is set up, you can use Claude Code to iterate. Here are common tasks:

### "Add a new page/feature"
Claude Code has full context from `CLAUDE.md`. Just describe what you want:
```
claude "Add a glucose tracking tab that shows a weekly chart of fasting readings"
```

### "Change the design"
```
claude "Make the meal cards show a small food emoji thumbnail instead of the letter initial"
```

### "Fix the API connection"
```
claude "The shopping checkbox isn't persisting — debug the toggleShopping POST"
```

### "Add a new recipe"
This is done in Google Sheets, not in code. Open the Recipes tab and add a row.

---

## Project structure summary

```
meal-planner-pwa/
├── CLAUDE.md                    # Full project context for Claude Code
├── CLAUDECODE_INSTRUCTIONS.md   # This file
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Vite + PWA config
├── tailwind.config.js           # Tailwind with custom colors
├── postcss.config.js
├── index.html                   # Entry HTML
├── .gitignore
├── .github/workflows/deploy.yml # Auto-deploy to GitHub Pages
├── public/
│   ├── favicon.svg
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.jsx                 # React entry
    ├── App.jsx                  # Shell: tabs, nav, setup screen
    ├── index.css                # Tailwind + custom component styles
    ├── pages/
    │   ├── CalendarPage.jsx     # Weekly meal calendar
    │   ├── ShoppingPage.jsx     # Grocery checklist
    │   ├── RecipesPage.jsx      # Recipe browser + detail view
    │   └── KitchenPage.jsx      # Kitchen staff timeline
    ├── hooks/
    │   └── useApi.js            # Fetch hook with caching
    ├── utils/
    │   ├── api.js               # API config + fetch functions
    │   ├── dates.js             # Date helpers
    │   ├── constants.js         # Colors, times, filter configs
    │   └── sampleData.js        # Demo data fallback
    └── assets/
        └── icons.jsx            # SVG icon components
```

## What's working out of the box

- All 4 tabs render with sample data
- Day selector switches meals on Calendar
- Shopping checkboxes toggle and update progress
- Recipe filter pills filter the list
- Recipe cards click through to detail view
- Kitchen timeline shows all tasks with picky alerts
- Dark mode auto-adapts
- PWA installable on Android
- Setup screen for API URL entry
- Demo mode banner when not connected

## What to iterate on next (with Claude Code)

1. **Pull-to-refresh** on each page
2. **Week navigation** (left/right arrows on Calendar to go to previous/next week)
3. **Recipe search** (text search across recipe names)
4. **Notification reminders** (PWA push for meal prep times)
5. **Glucose tracking tab** (Phase 5 from the roadmap)
6. **Bengali language toggle** (for kitchen staff who read Bangla)
