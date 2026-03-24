export const DIETARY_GROUPS = {
  'Diabetic':       { badge: 'badge-diabetic', label: 'M', short: 'Muhtasim' },
  'General-Adult':  { badge: 'badge-general',  label: 'A', short: 'Adults' },
  'Teen':           { badge: 'badge-teen',     label: 'T', short: 'Teens' },
  'Kid':            { badge: 'badge-kid',      label: 'K', short: 'Kids' },
  'Kid-Picky':      { badge: 'badge-picky',    label: 'P', short: 'Daughter' },
}

export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Snack', 'Dinner']

export const SLOT_TIMES = {
  Breakfast: '6:30 am',
  Lunch: '1:00 pm',
  Snack: '5:00 pm',
  Dinner: '9:30 pm',
}

export const SHOP_TAG_BADGE = {
  Daily: 'badge-daily',
  Weekly: 'badge-weekly',
}

export const CATEGORY_ORDER = [
  'Protein', 'Vegetables', 'Fruits', 'Grains & Dal', 'Dairy', 'Snacks', 'Oils & Spices', 'Other'
]

export const RECIPE_FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'dinner',  label: 'Dinner' },
  { key: 'kid',     label: 'Kid-friendly' },
  { key: 'quick',   label: 'Under 30 min' },
]

export const SHOP_FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'daily',  label: 'Daily fresh' },
  { key: 'weekly', label: 'Weekly bulk' },
]
