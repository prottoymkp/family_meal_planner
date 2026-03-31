// Bengali translations for recipe names and common kitchen terms
// Recipe name mappings (English → Bangla)
const RECIPE_NAMES_BN = {
  'Egg omelette + chapati': 'ডিম অমলেট + চাপাটি',
  'Dal + rice + mixed veg + egg': 'ডাল + ভাত + মিক্সড সবজি + ডিম',
  'Apple + roasted chana': 'আপেল + ভাজা ছোলা',
  'Chicken & lau curry': 'মুরগি ও লাউ তরকারি',
  'Protein oats': 'প্রোটিন ওটস',
  'Yogurt + cucumber raita': 'দই + শশা রায়তা',
  'Palak dal with ruti': 'পালং ডাল ও রুটি',
  'Chira upma with egg': 'চিড়া উপমা ও ডিম',
  'Grilled fish + stir-fry veggies': 'গ্রিল মাছ + সবজি ভাজি',
  'Vegetable dal khichuri': 'সবজি ডাল খিচুড়ি',
  // Common meal components
  'Dal': 'ডাল',
  'Rice': 'ভাত',
  'Roti': 'রুটি',
  'Chapati': 'চাপাটি',
  'Paratha': 'পরোটা',
  'Fish': 'মাছ',
  'Chicken': 'মুরগি',
  'Egg': 'ডিম',
  'Vegetables': 'সবজি',
  'Salad': 'সালাদ',
  'Curry': 'তরকারি',
  'Khichuri': 'খিচুড়ি',
  'Biryani': 'বিরিয়ানি',
  'Pulao': 'পোলাও',
}

// Slot names in Bengali
const SLOT_NAMES_BN = {
  Breakfast: 'সকালের নাস্তা',
  Lunch: 'দুপুরের খাবার',
  Snack: 'বিকালের নাস্তা',
  Dinner: 'রাতের খাবার',
  Shopping: 'বাজার',
}

// Common UI labels in Bengali
const UI_LABELS_BN = {
  'People to feed': 'খাওয়াতে হবে',
  'Meals today': 'আজকের খাবার',
  "Today's timeline": 'আজকের সময়সূচি',
  'Shopping list': 'বাজারের তালিকা',
  'Shopping progress': 'বাজারের অগ্রগতি',
  'items checked': 'আইটেম কেনা হয়েছে',
  'No meals planned': 'কোনো খাবার পরিকল্পনা নেই',
  'Picky eater': 'বাছাই খাদক',
  'daughter refuses': 'মেয়ে খায় না',
  'items': 'আইটেম',
  'Recipe collection': 'রেসিপি সংগ্রহ',
  "Today's kitchen": 'আজকের রান্নাঘর',
  "This week's meals": 'এই সপ্তাহের খাবার',
}

// Get Bengali recipe name, fallback to English
export function getRecipeNameBn(englishName) {
  if (!englishName) return ''
  // Exact match
  if (RECIPE_NAMES_BN[englishName]) return RECIPE_NAMES_BN[englishName]
  // Partial match — try to find key that's contained in the name
  for (const [en, bn] of Object.entries(RECIPE_NAMES_BN)) {
    if (englishName.toLowerCase().includes(en.toLowerCase())) return bn
  }
  return englishName // fallback to English
}

export function getSlotNameBn(slot) {
  return SLOT_NAMES_BN[slot] || slot
}

export function getLabelBn(key) {
  return UI_LABELS_BN[key] || key
}
