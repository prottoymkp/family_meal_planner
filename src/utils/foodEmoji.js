// Maps recipe keywords to food emojis for visual thumbnails
const FOOD_MAP = [
  // Proteins
  [/chicken/i, '🍗'], [/fish|rui|hilsa|tilapia/i, '🐟'], [/egg|omelette/i, '🍳'],
  [/mutton|goat|lamb/i, '🥩'], [/beef/i, '🥩'], [/shrimp|prawn/i, '🦐'],
  // Grains
  [/rice|bhaat|biryani|pulao|khichuri/i, '🍚'], [/roti|ruti|chapati|paratha|naan/i, '🫓'],
  [/oats|oatmeal/i, '🥣'], [/chira|upma/i, '🥣'], [/pasta|noodle/i, '🍝'],
  // Vegetables
  [/palak|spinach/i, '🥬'], [/lau|gourd/i, '🥒'], [/salad|cucumber/i, '🥗'],
  [/potato|aloo/i, '🥔'], [/mixed veg|sabji|stir.?fry/i, '🥦'],
  // Fruits & Snacks
  [/apple/i, '🍎'], [/banana/i, '🍌'], [/mango/i, '🥭'], [/yogurt|raita|dahi/i, '🥛'],
  [/chana|chickpea|roasted/i, '🫘'],
  // Soups & Dals
  [/dal|daal|lentil/i, '🍲'], [/soup/i, '🍲'], [/curry/i, '🍛'],
  // Misc
  [/sandwich/i, '🥪'], [/toast|bread/i, '🍞'], [/smoothie|juice/i, '🥤'],
  [/cake|sweet|dessert/i, '🍰'], [/tea|chai/i, '🍵'],
]

// Slot-based fallback emojis
const SLOT_EMOJI = {
  Breakfast: '🌅',
  Lunch: '🍽️',
  Snack: '🍎',
  Dinner: '🌙',
}

export function getFoodEmoji(recipeName, slot) {
  if (!recipeName) return SLOT_EMOJI[slot] || '🍽️'
  for (const [pattern, emoji] of FOOD_MAP) {
    if (pattern.test(recipeName)) return emoji
  }
  return SLOT_EMOJI[slot] || '🍽️'
}

// Background colors for food thumbnail cards (inline styles to avoid Tailwind purge)
const BG_COLORS = [
  '#FFF3E0', // warm orange
  '#E0F2F1', // teal
  '#E8EAF6', // indigo
  '#FCE4EC', // rose
  '#F3E5F5', // violet
  '#FFF9C4', // yellow
]

export function getBgColor(index) {
  return BG_COLORS[index % BG_COLORS.length]
}
