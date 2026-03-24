export const sampleMealPlan = {
  weekStart: '2026-03-23',
  days: [
    {
      date: '2026-03-23', day: 'Monday',
      meals: [
        { slot: 'Breakfast', recipeId: 'R015', recipeName: 'Egg omelette + chapati', cookScaledFor: 7,
          portions: { muhtasim: '1 egg + 1 small chapati (22g carb)', adults: 'Standard', teens: 'Larger portion', kids: 'Mild, see modifier' },
          pickyModifier: 'Daughter: paratha + jam, banana, milk', kitchenNotes: '', assignedCook: 'Cook A' },
        { slot: 'Lunch', recipeId: 'R018', recipeName: 'Dal + rice + mixed veg + egg', cookScaledFor: 7,
          portions: { muhtasim: '1/2 cup rice, 1 cup dal, 2 cup veg (48g carb)', adults: '3/4 cup rice', teens: '1 cup rice', kids: 'Mild, 1/2 cup rice' },
          pickyModifier: 'Daughter: plain dal-bhaat, fried egg, no spicy sabji', kitchenNotes: '', assignedCook: 'Cook A + B' },
        { slot: 'Snack', recipeId: 'R019', recipeName: 'Apple + roasted chana', cookScaledFor: 7,
          portions: { muhtasim: '1 apple + 1/2 cup chana', adults: 'Same', teens: 'Same + extra nuts', kids: 'See modifier' },
          pickyModifier: 'Daughter: apple slices with PB, or banana', kitchenNotes: '', assignedCook: 'Cook A' },
        { slot: 'Dinner', recipeId: 'R003', recipeName: 'Chicken & lau curry', cookScaledFor: 7,
          portions: { muhtasim: '1 roti, 1.5 cup curry, no rice', adults: '1 roti + 1/3 cup rice', teens: '2 roti, 1.5 cup curry', kids: 'Mild curry, rice, shredded chicken' },
          pickyModifier: 'Daughter: lau curry mild, shred chicken off bone. Backup: dal-bhaat + egg', kitchenNotes: '', assignedCook: 'Cook A + B' },
      ]
    },
    {
      date: '2026-03-24', day: 'Tuesday',
      meals: [
        { slot: 'Breakfast', recipeId: 'R016', recipeName: 'Protein oats', cookScaledFor: 7,
          portions: { muhtasim: '3 tbsp oats + egg (30g carb)', adults: 'Same', teens: 'Larger bowl', kids: 'Oats with banana + honey' },
          pickyModifier: 'Daughter: oats with banana + honey, skip boiled egg', kitchenNotes: '', assignedCook: 'Cook A' },
        { slot: 'Lunch', recipeId: 'R018', recipeName: 'Dal + rice + mixed veg + egg', cookScaledFor: 7,
          portions: { muhtasim: '1/2 cup rice', adults: '3/4 cup rice', teens: '1 cup rice', kids: '1/2 cup rice' },
          pickyModifier: 'Daughter: plain dal-bhaat + fried egg', kitchenNotes: '', assignedCook: 'Cook A + B' },
        { slot: 'Snack', recipeId: 'R020', recipeName: 'Yogurt + cucumber raita', cookScaledFor: 7,
          portions: { muhtasim: '1/2 cup yogurt + cucumber', adults: 'Same', teens: 'Same', kids: 'See modifier' },
          pickyModifier: 'Daughter: yogurt with diced mango or banana', kitchenNotes: '', assignedCook: 'Cook A' },
        { slot: 'Dinner', recipeId: 'R004', recipeName: 'Palak dal with ruti', cookScaledFor: 7,
          portions: { muhtasim: '1.5 cup dal, 1 roti', adults: 'Same + extra roti', teens: '2 roti', kids: 'See modifier' },
          pickyModifier: 'Daughter: blend dal smooth (hide spinach), serve with paratha', kitchenNotes: '', assignedCook: 'Cook A + B' },
      ]
    },
    {
      date: '2026-03-25', day: 'Wednesday',
      meals: [
        { slot: 'Breakfast', recipeId: 'R017', recipeName: 'Chira upma with egg', cookScaledFor: 7,
          portions: { muhtasim: '1/2 cup chira + egg', adults: 'Same', teens: 'Larger', kids: 'See modifier' },
          pickyModifier: 'Daughter: plain chira with sugar + milk', kitchenNotes: '', assignedCook: 'Cook A' },
        { slot: 'Lunch', recipeId: 'R018', recipeName: 'Dal + rice + mixed veg + egg', cookScaledFor: 7,
          portions: { muhtasim: '1/2 cup rice', adults: '3/4 cup', teens: '1 cup', kids: '1/2 cup' },
          pickyModifier: 'Daughter: plain dal-bhaat + fried egg', kitchenNotes: '', assignedCook: 'Cook A + B' },
        { slot: 'Snack', recipeId: 'R019', recipeName: 'Apple + roasted chana', cookScaledFor: 7,
          portions: { muhtasim: '1 apple + chana', adults: 'Same', teens: 'Same', kids: 'Apple + PB' },
          pickyModifier: 'Daughter: apple slices with PB', kitchenNotes: '', assignedCook: 'Cook A' },
        { slot: 'Dinner', recipeId: 'R002', recipeName: 'Grilled fish + stir-fry veggies', cookScaledFor: 7,
          portions: { muhtasim: 'Fish + veggies, no rice', adults: 'Fish + veggies + 1/3 cup rice', teens: 'Larger + rice', kids: 'See modifier' },
          pickyModifier: 'Daughter: fish fingers (coat in atta, shallow fry), plain rice', kitchenNotes: '', assignedCook: 'Cook A + B' },
      ]
    },
  ]
}

export const sampleShopping = {
  total: 15, checked: 3, progress: 20,
  categories: {
    Protein: [
      { row: 2, ingredient: 'Chicken breast (skinless)', category: 'Protein', quantity: '500g', unit: 'g', tag: 'Daily', checked: false, shopper: 'Shopper B', notes: 'For dinner' },
      { row: 3, ingredient: 'Eggs', category: 'Protein', quantity: '2 dozen', unit: 'dozen', tag: 'Weekly', checked: true, shopper: 'Shopper A', notes: '' },
      { row: 4, ingredient: 'Rui fish fillet', category: 'Protein', quantity: '300g', unit: 'g', tag: 'Daily', checked: false, shopper: 'Shopper B', notes: '' },
    ],
    Vegetables: [
      { row: 5, ingredient: 'Bottle gourd (lau)', category: 'Vegetables', quantity: '1 medium', unit: 'pc', tag: 'Daily', checked: false, shopper: 'Shopper B', notes: '' },
      { row: 6, ingredient: 'Spinach (palak)', category: 'Vegetables', quantity: '1 bunch', unit: 'bunch', tag: 'Daily', checked: false, shopper: 'Shopper B', notes: '' },
      { row: 7, ingredient: 'Mixed veg (carrot, beans)', category: 'Vegetables', quantity: '500g', unit: 'g', tag: 'Daily', checked: false, shopper: 'Shopper B', notes: '' },
      { row: 8, ingredient: 'Cucumber + tomato', category: 'Vegetables', quantity: '3 pcs each', unit: 'pc', tag: 'Daily', checked: false, shopper: 'Shopper B', notes: '' },
      { row: 9, ingredient: 'Onion + garlic + ginger', category: 'Vegetables', quantity: '1kg + 250g', unit: 'kg', tag: 'Weekly', checked: true, shopper: 'Shopper A', notes: '' },
    ],
    'Grains & Dal': [
      { row: 10, ingredient: 'Brown / parboiled rice', category: 'Grains & Dal', quantity: '3 kg', unit: 'kg', tag: 'Weekly', checked: true, shopper: 'Shopper A', notes: '' },
      { row: 11, ingredient: 'Whole wheat atta', category: 'Grains & Dal', quantity: '2 kg', unit: 'kg', tag: 'Weekly', checked: false, shopper: 'Shopper A', notes: '' },
      { row: 12, ingredient: 'Masoor dal', category: 'Grains & Dal', quantity: '1 kg', unit: 'kg', tag: 'Weekly', checked: false, shopper: 'Shopper A', notes: '' },
      { row: 13, ingredient: 'Moong dal', category: 'Grains & Dal', quantity: '500g', unit: 'g', tag: 'Weekly', checked: false, shopper: 'Shopper A', notes: '' },
    ],
    Fruits: [
      { row: 14, ingredient: 'Apples', category: 'Fruits', quantity: '4 pcs', unit: 'pc', tag: 'Daily', checked: false, shopper: 'Shopper B', notes: '' },
      { row: 15, ingredient: 'Bananas (small)', category: 'Fruits', quantity: '6 pcs', unit: 'pc', tag: 'Daily', checked: false, shopper: 'Shopper B', notes: '' },
    ],
  }
}

export const sampleRecipes = {
  count: 6,
  recipes: [
    { id: 'R001', name: 'Vegetable dal khichuri', category: 'Dinner', cuisine: 'Bangladeshi', prepTime: 10, cookTime: 25, difficulty: 'Easy',
      tags: ['diabetic-safe', 'nafld-friendly'], kidFriendly: true, pickyOk: true, calories: 320, carbs: 38, protein: 14, fat: 8, fiber: 9, baseServings: 1,
      ingredients: [{ key: 'brown_rice', qty: 0.25, unit: 'cup' }, { key: 'lentils_mixed', qty: 0.5, unit: 'cup' }, { key: 'mixed_veg', qty: 2, unit: 'cup' }],
      method: '1. Soak rice/dal 15min. 2. Pressure cook with veggies, spices, water. 3. Optional tarka. 4. Serve with cucumber salad.',
      pickyModifier: 'Kids: serve plain, less spice, add a fried egg on top', notes: 'One-pot meal.' },
    { id: 'R002', name: 'Grilled fish + stir-fry veggies', category: 'Dinner', cuisine: 'Bangladeshi', prepTime: 15, cookTime: 15, difficulty: 'Easy',
      tags: ['diabetic-safe', 'low-carb'], kidFriendly: false, pickyOk: false, calories: 290, carbs: 12, protein: 28, fat: 10, fiber: 5, baseServings: 1,
      ingredients: [{ key: 'rui_fish', qty: 150, unit: 'g' }, { key: 'broccoli', qty: 1, unit: 'cup' }, { key: 'carrot', qty: 0.5, unit: 'cup' }],
      method: '1. Marinate fish. 2. Pan-sear. 3. Stir-fry veggies. 4. Serve.',
      pickyModifier: 'Kids: fish fingers version, plain rice on side', notes: 'Rich in omega-3.' },
    { id: 'R003', name: 'Chicken & lau curry', category: 'Dinner', cuisine: 'Bangladeshi', prepTime: 10, cookTime: 30, difficulty: 'Easy',
      tags: ['diabetic-safe', 'nafld-friendly'], kidFriendly: true, pickyOk: true, calories: 340, carbs: 18, protein: 24, fat: 12, fiber: 4, baseServings: 1,
      ingredients: [{ key: 'chicken_breast', qty: 120, unit: 'g' }, { key: 'lau', qty: 2, unit: 'cup' }],
      method: '1. Saute ginger/garlic. 2. Brown chicken. 3. Add lau, simmer. 4. Finish with coriander.',
      pickyModifier: 'Kids: mild, shred chicken, serve curry separately', notes: 'Lau is very low calorie.' },
    { id: 'R004', name: 'Palak dal with ruti', category: 'Dinner', cuisine: 'Bangladeshi', prepTime: 5, cookTime: 25, difficulty: 'Easy',
      tags: ['diabetic-safe', 'nafld-friendly'], kidFriendly: true, pickyOk: true, calories: 310, carbs: 35, protein: 16, fat: 6, fiber: 10, baseServings: 1,
      ingredients: [{ key: 'masoor_dal', qty: 0.5, unit: 'cup' }, { key: 'spinach', qty: 2, unit: 'cup' }],
      method: '1. Boil dal. 2. Saute garlic + dal + spinach. 3. Serve with roti.',
      pickyModifier: 'Kids: blend dal smooth (hide spinach), paratha', notes: 'High fiber + iron.' },
    { id: 'R015', name: 'Egg omelette + chapati', category: 'Breakfast', cuisine: 'Bangladeshi', prepTime: 5, cookTime: 10, difficulty: 'Easy',
      tags: ['diabetic-safe'], kidFriendly: true, pickyOk: true, calories: 280, carbs: 22, protein: 15, fat: 14, fiber: 3, baseServings: 1,
      ingredients: [{ key: 'eggs', qty: 2, unit: 'pc' }, { key: 'whole_wheat_roti', qty: 1, unit: 'pc' }],
      method: '1. Beat eggs with vegetables. 2. Cook omelette. 3. Serve with chapati.',
      pickyModifier: 'Kids: plain omelette, paratha + jam, banana', notes: 'Quick protein start.' },
    { id: 'R018', name: 'Dal + rice + mixed veg + egg', category: 'Lunch', cuisine: 'Bangladeshi', prepTime: 10, cookTime: 30, difficulty: 'Easy',
      tags: ['diabetic-safe', 'everyday'], kidFriendly: true, pickyOk: true, calories: 420, carbs: 48, protein: 18, fat: 10, fiber: 8, baseServings: 1,
      ingredients: [{ key: 'masoor_dal', qty: 0.5, unit: 'cup' }, { key: 'rice', qty: 0.5, unit: 'cup' }, { key: 'mixed_veg', qty: 1.5, unit: 'cup' }, { key: 'eggs', qty: 1, unit: 'pc' }],
      method: '1. Cook dal. 2. Cook rice. 3. Cook veg. 4. Boil egg. 5. Plate per portion guide.',
      pickyModifier: 'Kids: plain dal-bhaat, fried egg, no spicy sabji', notes: 'Everyday lunch template.' },
  ]
}

export const sampleKitchenDay = {
  date: '2026-03-23', day: 'Monday', peopleToFeed: 7, mealsToday: 4,
  timeline: [
    { prepTime: '6:00 AM', serveTime: '6:30 AM', slot: 'Breakfast', recipe: 'Egg omelette + chapati', recipeId: 'R015', scaledFor: 7, assignedCook: 'Cook A',
      portions: { muhtasim: '1 egg + 1 chapati', adults: 'Standard', teens: 'Larger', kids: 'See modifier' },
      pickyModifier: 'Daughter: paratha + jam, banana, milk', kitchenNotes: '' },
    { prepTime: '10:00 AM', slot: 'Shopping', recipe: 'Daily market run', assignedCook: 'Shopper B', kitchenNotes: 'Chicken 500g, lau 1pc, palak, mixed veg, fish' },
    { prepTime: '11:30 AM', serveTime: '1:00 PM', slot: 'Lunch', recipe: 'Dal + rice + mixed veg + egg', recipeId: 'R018', scaledFor: 7, assignedCook: 'Cook A + B',
      portions: { muhtasim: '1/2 cup rice', adults: '3/4 cup', teens: '1 cup', kids: '1/2 cup' },
      pickyModifier: 'Daughter: plain dal-bhaat, fried egg, no spicy sabji', kitchenNotes: '' },
    { prepTime: '4:30 PM', serveTime: '5:00 PM', slot: 'Snack', recipe: 'Apple + roasted chana', recipeId: 'R019', scaledFor: 7, assignedCook: 'Cook A',
      pickyModifier: 'Daughter: apple slices with PB, or banana', kitchenNotes: '' },
    { prepTime: '7:30 PM', serveTime: '9:30 PM', slot: 'Dinner', recipe: 'Chicken & lau curry', recipeId: 'R003', scaledFor: 7, assignedCook: 'Cook A + B',
      portions: { muhtasim: '1 roti, no rice', adults: '1 roti + rice', teens: '2 roti', kids: 'Mild curry + rice' },
      pickyModifier: 'Daughter: lau curry mild, shred chicken. Backup: dal-bhaat + egg', kitchenNotes: 'Cook base mild. Add spice to adult portions after.' },
  ],
  pickyAlerts: ['Bitter gourd (korola)', 'Strong fish (hilsa, mackerel)', 'Bone-in chicken', 'Spicy food', 'Most sabji/mixed veg']
}
