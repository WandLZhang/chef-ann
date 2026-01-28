export interface RecipeIngredient {
  name: string;
  amount: string;
  measure?: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  proteinType?: 'Beef' | 'Pork' | 'Chicken' | 'Turkey' | 'Fish' | 'Legumes' | 'Vegetarian' | 'Cheese' | 'Other';
  servingSize: string;
  servingDescription: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  pairingSuggestions?: string[];
  image?: string;
}

export const recipes: Recipe[] = [
  {
    id: 'FS004',
    name: 'Beef and Broccoli K-8',
    category: 'Entree',
    proteinType: 'Beef',
    servingSize: '1 Bowl',
    servingDescription: '1/2 cup beef mix (3.75oz) with 1/2 cup rice',
    ingredients: [
      { name: 'Beef Chuck Roast', amount: '10 lbs 8 oz' },
      { name: 'Broccoli Crowns', amount: '10 lbs 6 oz' },
      { name: 'Brown Rice', amount: '4 lbs 8 oz' },
      { name: 'Soy Sauce', amount: '1 qt' },
      { name: 'Garlic', amount: '6 oz' },
      { name: 'Ginger Root', amount: '5 oz' }
    ],
    instructions: [
      'Trim meat and slice into 1/2" slices.',
      'Toss meat with garlic, ginger, soy sauce, cider vinegar, and cinnamon. Marinate for 30 mins.',
      'Steam brown rice.',
      'Cook beef in tilt skillet for 20 mins until crust forms.',
      'Add broccoli and steam until tender.',
      'Combine meat, broccoli, and Asian sauce. Cook until sauce thickens.'
    ],
    pairingSuggestions: ['Served with Brown Rice (included)']
  },
  {
    id: 'OU516',
    name: 'Beef Birria Tacos',
    category: 'Entree',
    proteinType: 'Beef',
    servingSize: '3 Tacos',
    servingDescription: '3 Tacos with 1oz beef and 1oz cheese each',
    ingredients: [
      { name: 'Beef Chuck Roast', amount: '33 lbs' },
      { name: 'Corn Tortillas', amount: '297 ea' },
      { name: 'Cotija Cheese', amount: '18 lbs 9 oz' },
      { name: 'Chipotle Peppers in Adobo', amount: '4 lbs 13 oz' },
      { name: 'Garlic', amount: '4 oz' }
    ],
    instructions: [
      'Brown beef in skillet.',
      'Add beef to hotel pans with garlic, chipotle, spices, and vinegar.',
      'Cover and cook at 275°F for 4 hours until shreddable.',
      'Shred beef.',
      'Assemble tacos with 1oz beef and 1oz cheese per tortilla.',
      'Briefly brown tacos in skillet before serving.'
    ],
    pairingSuggestions: ['Corn Salad', 'Mexican Rice']
  },
  {
    id: 'OU004',
    name: 'Beef Bulgogi',
    category: 'Entree',
    proteinType: 'Beef',
    servingSize: '1 Bowl',
    servingDescription: '4oz beef with 1/4 cup pickled veggies',
    ingredients: [
      { name: 'Shaved Beef Steak', amount: '15 lbs 10 oz' },
      { name: 'Cucumber', amount: '5 lbs 7 oz' },
      { name: 'Radish', amount: '5 lbs 5 oz' },
      { name: 'Carrots', amount: '3 lbs 2 oz' },
      { name: 'Soy Sauce', amount: '1 qt' },
      { name: 'Sesame Oil', amount: '1 cup' }
    ],
    instructions: [
      'Pickle vegetables in vinegar, salt, and sugar mixture.',
      'Marinate beef in soy sauce, garlic, sesame oil mixture.',
      'Saute beef until browned (approx 15 mins).',
      'Add marinade and green onions, cook 2 more minutes.'
    ],
    pairingSuggestions: ['Brown Rice', 'Kimchi']
  },
  {
    id: 'MB200',
    name: 'Beef Chili',
    category: 'Entree',
    proteinType: 'Beef',
    servingSize: '1 Cup',
    servingDescription: '1 Cup (8oz)',
    ingredients: [
      { name: 'Yellow Onion', amount: '7 lbs 2 oz' },
      { name: 'Garlic', amount: '12 oz' },
      { name: 'Red Kidney Beans', amount: '4 lbs 2 oz' },
      { name: 'Diced Tomatoes', amount: '39 lbs 12 oz' },
      { name: 'Tomato Paste', amount: '12 oz' },
      { name: 'Ground Beef (85/15)', amount: '24 lbs' }
    ],
    instructions: [
      'Dice onions and garlic. Drain and rinse beans.',
      'Puree 3/4 of the diced tomatoes.',
      'Cook tomato paste in oil until aromatic (5 mins).',
      'Add garlic and onion, cook 5-7 mins.',
      'Add beef and brown (10 mins). Drain grease.',
      'Add spices, cook 5 mins.',
      'Add tomatoes and beans, simmer 20 mins to 1 hour.'
    ],
    pairingSuggestions: ['Tortilla Chips', 'WG Dinner Roll', 'Brown Rice']
  },
  {
    id: 'MV065',
    name: 'Baked Potato with Taco Meat',
    category: 'Entree',
    proteinType: 'Beef',
    servingSize: '1 Each',
    servingDescription: '1 Baked Potato + 3oz taco meat + toppings',
    ingredients: [
      { name: 'Baking Potatoes (70ct)', amount: '46 lbs 15 oz' },
      { name: 'Ground Beef (85/15)', amount: '50 lbs' },
      { name: 'Red Kidney Beans', amount: '5 lbs 14 oz' },
      { name: 'Taco Seasoning', amount: '2 lbs 14 oz' },
      { name: 'Cheddar Cheese', amount: '4 lbs 6 oz' },
      { name: 'Broccoli Florets', amount: '10 lbs' }
    ],
    instructions: [
      'Make cheese sauce with butter, flour, milk, cheese, spices.',
      'Cook beef 20 mins to 165°F, drain fat.',
      'Puree kidney beans with water, add to beef with taco seasoning.',
      'Wrap potatoes in foil, bake at 375°F for 45 mins.',
      'Blanch and shock broccoli.',
      'Slice potato, add 3oz taco meat, 2oz cheese sauce, 1/4 cup broccoli.'
    ],
    pairingSuggestions: ['Sour Cream', 'Fresh Salsa']
  },
  {
    id: 'FS045',
    name: 'Crispy Chicken Sandwich',
    category: 'Entree',
    proteinType: 'Chicken',
    servingSize: '1 Sandwich',
    servingDescription: '1 piece chicken (3oz) on hamburger bun',
    ingredients: [
      { name: 'Chicken Breast (Random)', amount: '28 lbs 9 oz' },
      { name: 'Whole Grain Bun', amount: '100 ea' },
      { name: 'Buttermilk', amount: '3 qts' },
      { name: 'Flour', amount: '8 lbs' },
      { name: 'Spices (Paprika, Chili Powder, Pepper)', amount: 'Variable' }
    ],
    instructions: [
      'Trim chicken into 4.5oz pieces.',
      'Dredge in seasoned flour, dip in buttermilk, then flour again.',
      'Bake at 400°F for 15-20 minutes until crispy and 165°F internal temp.',
      'Serve on whole grain bun.'
    ],
    pairingSuggestions: ['Sweet Potato Fries', 'Coleslaw']
  },
  {
    id: 'MP003',
    name: 'Chicken Enchiladas',
    category: 'Entree',
    proteinType: 'Chicken',
    servingSize: '2 Enchiladas',
    servingDescription: '2 Enchiladas (approx 8oz total)',
    ingredients: [
      { name: 'Chicken Thigh Strips', amount: '13 lbs 8 oz' },
      { name: 'WG Tortillas 6"', amount: '200 ea' },
      { name: 'Black Beans', amount: '4 lbs 2 oz' },
      { name: 'Cheddar Cheese', amount: '8 lbs 5 oz' },
      { name: 'Enchilada Sauce (scratch made)', amount: 'Variable' }
    ],
    instructions: [
      'Make enchilada sauce with tomato, spices, and veggie puree.',
      'Mix chicken, half cheese, beans, and spices for filling.',
      'Roll 2oz filling into each tortilla.',
      'Place in hotel pans, cover with sauce.',
      'Bake covered 20 mins, then uncover, top with remaining cheese and bake 10-15 mins.'
    ],
    pairingSuggestions: ['Mexican Rice', 'Corn Salad']
  },
  {
    id: 'FS010',
    name: 'Butternut Squash and Chicken Curry',
    category: 'Entree',
    proteinType: 'Chicken',
    servingSize: '1 Cup',
    servingDescription: '1 Cup (8oz) stew',
    ingredients: [
      { name: 'Chicken Thigh Strips', amount: '14 lbs 4 oz' },
      { name: 'Butternut Squash', amount: '10 lbs 13 oz' },
      { name: 'Kale', amount: '4 lbs 7 oz' },
      { name: 'Coconut Milk', amount: '4 #10 cans' },
      { name: 'Curry Powder', amount: '1 cup' }
    ],
    instructions: [
      'Saute squash and onions.',
      'Add garlic, ginger, spices and coconut milk. Bring to boil.',
      'Add chicken and simmer 20 minutes.',
      'Add kale and lime juice, stir until wilted.'
    ],
    pairingSuggestions: ['Brown Rice', 'Naan Bread']
  },
  {
    id: 'MP070',
    name: 'Chicken Burrito',
    category: 'Entree',
    proteinType: 'Chicken',
    servingSize: '1 Burrito',
    servingDescription: '1 Burrito (K-2: half burrito)',
    ingredients: [
      { name: 'Brown Rice', amount: '3 lbs 6 oz' },
      { name: 'Chicken Thigh Strips', amount: '5 lbs 1 oz' },
      { name: 'Cheddar Cheese', amount: '2 lbs 13 oz' },
      { name: 'Pinto Beans', amount: '17 lbs 3 oz' },
      { name: 'Salsa', amount: '1 qt 1 pt' },
      { name: 'WG Tortilla 9"', amount: '90 ea' }
    ],
    instructions: [
      'Cook and chill brown rice.',
      'Prepare refried beans: drain, combine with cumin/salt, burr mix.',
      'Mix cold chicken, beans, cheese, rice, spices, and salsa.',
      'Place 4oz filling in center of tortilla.',
      'Fold sides and roll up.',
      'Bake covered at 350°F for ~1 hour to 165°F.'
    ],
    pairingSuggestions: ['Mexican Rice', 'Fresh Fruit']
  },
  {
    id: 'R8998',
    name: 'Chicken Pozole',
    category: 'Entree',
    proteinType: 'Chicken',
    servingSize: '1 Cup',
    servingDescription: '1 Cup (8oz) with tortilla chips',
    ingredients: [
      { name: 'Chicken Base', amount: '8 oz' },
      { name: 'Yellow Onion', amount: '9 lbs' },
      { name: 'Diced Chicken', amount: '6 lbs 4 oz' },
      { name: 'Tomatillos', amount: '25 lbs' },
      { name: 'Dried Pasilla Peppers', amount: '2 lbs 8 oz' },
      { name: 'White Hominy', amount: '15 lbs 8 oz' },
      { name: 'Tortilla Chips', amount: '12 lbs 8 oz' }
    ],
    instructions: [
      'Make broth with chicken base and water.',
      'Dice onions, mince garlic, chop cilantro.',
      'Saute onions until translucent.',
      'Add chicken, garlic, and seasonings.',
      'Add broth, tomatillos, peppers, and hominy.',
      'Bring to boil, reduce and simmer.',
      'Serve 1 cup topped with cilantro and 2oz chips (~24 chips).'
    ],
    pairingSuggestions: ['Lime Wedges', 'Fresh Cilantro']
  },
  {
    id: 'OU002',
    name: 'Banh Mi Sandwich',
    category: 'Entree',
    proteinType: 'Chicken',
    servingSize: '1 Sandwich',
    servingDescription: '1 Sandwich (3oz baguette + fillings)',
    ingredients: [
      { name: 'Chicken Thigh Strips', amount: '17 lbs 13 oz' },
      { name: 'WG Baguette', amount: '18 lbs 12 oz' },
      { name: 'Cucumber', amount: '5 lbs 3 oz' },
      { name: 'Jalapeno', amount: '2 lbs 1 oz' },
      { name: 'Carrots', amount: '4 lbs 3 oz' },
      { name: 'Cilantro', amount: '8 oz' },
      { name: 'Mayonnaise', amount: '2 qts' }
    ],
    instructions: [
      'Slice cucumber, jalapeno, radishes. Shred carrots.',
      'Cut baguette into thirds (3oz rolls).',
      'Make quick pickle with salt, sugar, vinegar.',
      'Marinate chicken in fish sauce, soy, lime, garlic.',
      'Bake chicken at 350°F for 25 mins to 165°F.',
      'Spread 2 tbsp mayo on baguette.',
      'Top with 2.85oz chicken, pickled veggies, cilantro, jalapenos.'
    ],
    pairingSuggestions: ['Cucumber Salad', 'Fresh Fruit']
  },
  {
    id: 'MP320',
    name: 'Oven Fried Chicken Drumstick',
    category: 'Entree',
    proteinType: 'Chicken',
    servingSize: '1 Drumstick',
    servingDescription: '1 Drumstick (~3.2oz raw)',
    ingredients: [
      { name: 'Chicken Drumsticks', amount: '91 ea' },
      { name: 'Flour', amount: '6 lbs' },
      { name: 'Buttermilk', amount: '2 qts 1.5 pts' },
      { name: 'Chili Powder', amount: '9 tbsp' },
      { name: 'Paprika', amount: '9 tbsp' },
      { name: 'Oil', amount: '1.75 cups' }
    ],
    instructions: [
      'Thaw chicken.',
      'Prepare flour bin 1: half flour + salt.',
      'Prepare flour bin 2: rest of flour + all spices.',
      'Dredge chicken in bin 1, dip in buttermilk, coat in bin 2.',
      'Place on lined sheet pans, spray with oil.',
      'Bake at 350°F for 25 mins to 165°F internal.',
      'Serve immediately.'
    ],
    pairingSuggestions: ['Mashed Potatoes', 'Green Beans', 'WG Roll']
  },
  {
    id: 'MB450',
    name: 'Cuban Sandwich',
    category: 'Entree',
    proteinType: 'Pork',
    servingSize: '1 Sandwich',
    servingDescription: '1 Sandwich with pork, ham, cheese, pickles',
    ingredients: [
      { name: 'Pork Leg Roast', amount: '9 lbs 8 oz' },
      { name: 'Ham (Slicing)', amount: '5 lbs 8 oz' },
      { name: 'Swiss Cheese', amount: '3 lbs 2 oz' },
      { name: 'Pickles', amount: '3 lbs 2 oz' },
      { name: 'Slider Buns', amount: '100 ea' },
      { name: 'Mustard', amount: '1 qt' }
    ],
    instructions: [
      'Roast pork with cumin, salt, pepper until tender (4-6 hours). Shred.',
      'Assemble sandwiches: Mustard, ham slice, swiss cheese, shredded pork, pickles.',
      'Bake assembled sandwiches at 350°F for 15-20 mins to melt cheese.'
    ],
    pairingSuggestions: ['Plantain Chips', 'Black Bean Soup']
  },
  {
    id: 'FS041',
    name: 'Pork Green Chili Burrito',
    category: 'Entree',
    proteinType: 'Pork',
    servingSize: '1 Burrito',
    servingDescription: '1 Burrito (approx 10oz)',
    ingredients: [
      { name: 'Pork Butt', amount: '6 lbs 10 oz' },
      { name: 'WG Tortilla 9"', amount: '100 ea' },
      { name: 'Brown Rice', amount: '2 lbs' },
      { name: 'Black Beans', amount: '6 lbs 12 oz' },
      { name: 'Cheddar Cheese', amount: '4 lbs' },
      { name: 'Green Chilies', amount: '3 lbs 3 oz' }
    ],
    instructions: [
      'Roast pork with spices and green chilies until tender (4 hours). Shred.',
      'Mix pork with cooked rice, cheese, beans, and roasted peppers.',
      'Scoop filling into tortillas and roll.',
      'Reheat burritos covered at 350°F for 20 mins.'
    ],
    pairingSuggestions: ['Salsa', 'Sour Cream']
  },
  {
    id: 'OU521',
    name: 'Salmon Rice Bowl',
    category: 'Entree',
    proteinType: 'Fish',
    servingSize: '1 Bowl',
    servingDescription: '3oz Salmon with 1/2 cup rice and veggies',
    ingredients: [
      { name: 'Salmon Fillet', amount: 'Variable' },
      { name: 'Brown Rice', amount: 'Variable' },
      { name: 'Edamame', amount: 'Variable' },
      { name: 'Carrots', amount: 'Variable' },
      { name: 'Teriyaki Sauce', amount: 'Variable' }
    ],
    instructions: [
      'Bake salmon fillets at 350°F until flaky.',
      'Steam brown rice.',
      'Steam edamame and carrots.',
      'Assemble bowls: Rice base, topped with salmon and veggies.',
      'Drizzle with teriyaki sauce.'
    ],
    pairingSuggestions: ['Miso Soup', 'Cucumber Salad']
  },
  {
    id: 'MV401',
    name: 'Black Bean Veggie Burger',
    category: 'Entree',
    proteinType: 'Vegetarian',
    servingSize: '1 Sandwich',
    servingDescription: '1 Patty on 2oz whole grain bun',
    ingredients: [
      { name: 'Black Beans', amount: '6 lbs 4 oz' },
      { name: 'Brown Rice', amount: '2 lbs 4 oz' },
      { name: 'Corn', amount: '5 lbs 15 oz' },
      { name: 'Green Peppers', amount: '2 lbs 15 oz' },
      { name: 'Corn Tortillas (binder)', amount: '24 ea' },
      { name: 'WG Burger Bun', amount: '100 ea' }
    ],
    instructions: [
      'Roast veggies.',
      'Process corn tortillas into flour-like consistency.',
      'Mix rice, beans, veggies, spices, and binder.',
      'Form into 4oz patties.',
      'Bake at 350°F for 15 minutes.'
    ],
    pairingSuggestions: ['Sweet Potato Fries', 'Green Salad']
  },
  {
    id: 'PF009',
    name: 'Chickpea Masala',
    category: 'Entree',
    proteinType: 'Legumes',
    servingSize: '1 Bowl',
    servingDescription: '3/4 Cup (7.5oz) curry',
    ingredients: [
      { name: 'Garbanzo Beans', amount: '32 lbs 12 oz' },
      { name: 'Diced Tomatoes', amount: '16 lbs' },
      { name: 'Spinach', amount: '3 lbs 12 oz' },
      { name: 'Onions', amount: '7 lbs 8 oz' },
      { name: 'Curry Powder', amount: '3 oz' }
    ],
    instructions: [
      'Saute onions, garlic, ginger with spices.',
      'Add pureed tomatoes and simmer.',
      'Add chickpeas and heat through.',
      'Stir in spinach until wilted.'
    ],
    pairingSuggestions: ['Brown Rice', 'Naan']
  },
  {
    id: 'MV017',
    name: 'Bean & Cheese Nachos',
    category: 'Entree',
    proteinType: 'Legumes',
    servingSize: '1 Serving',
    servingDescription: '2oz chips + beans + cheese sauce',
    ingredients: [
      { name: 'Pinto Beans', amount: '32 lbs 4 oz' },
      { name: 'Tortilla Chips', amount: '15 lbs' },
      { name: 'Cheddar Cheese', amount: '4 lbs 3 oz' },
      { name: 'Milk (1%)', amount: '1 gal 1 qt' },
      { name: 'Butter', amount: '13 oz' },
      { name: 'Flour', amount: '13 oz' }
    ],
    instructions: [
      'Drain beans, reserve liquid.',
      'Combine beans with cumin and salt, burr mix until smooth.',
      'Make cheese sauce: Melt butter, add flour for roux.',
      'Whisk in milk, bring to simmer.',
      'Add cheese and seasonings.',
      'Reheat beans and cheese sauce to 165°F.',
      'Serve 2oz chips with 1/4 cup beans and 2oz cheese sauce.'
    ],
    pairingSuggestions: ['Salsa', 'Fresh Fruit']
  },
  {
    id: 'Ing002',
    name: '3 Sisters Stew',
    category: 'Entree',
    proteinType: 'Vegetarian',
    servingSize: '1 Cup',
    servingDescription: '1 Cup (8.75oz)',
    ingredients: [
      { name: 'Butternut Squash', amount: '14 lbs' },
      { name: 'Yellow Onion', amount: '2 lbs 5 oz' },
      { name: 'Green Pepper', amount: '4 lbs 9 oz' },
      { name: 'Corn (frozen)', amount: '4 lbs 11 oz' },
      { name: 'Pinto Beans', amount: '6 lbs 2 oz' },
      { name: 'Diced Tomatoes', amount: '12 lbs 4 oz' },
      { name: 'Chicken Stock (low sodium)', amount: '42 cups' }
    ],
    instructions: [
      'Preheat oven to 375°F.',
      'Dice butternut squash, onions, and bell peppers. Mince garlic.',
      'Roast butternut squash on sheet pan for 30 mins.',
      'Saute onion and garlic in oil for 5 mins.',
      'Add all spices and stir.',
      'Add bell pepper, squash, remaining ingredients.',
      'Simmer for about an hour.'
    ],
    pairingSuggestions: ['Cornbread', 'WG Dinner Roll']
  },
  {
    id: 'FS034',
    name: 'Macaroni and Cheese K-8',
    category: 'Entree',
    proteinType: 'Vegetarian',
    servingSize: '1 Bowl',
    servingDescription: '3/4 Cup (5.7oz)',
    ingredients: [
      { name: 'WG Elbow Pasta', amount: '6 lbs 10 oz' },
      { name: 'Cheddar Cheese', amount: '10 lbs 6 oz' },
      { name: 'Milk (1%)', amount: '2 gal 2 qt' },
      { name: 'Butter', amount: '1 lb 8 oz' },
      { name: 'Flour', amount: '1 lb 8 oz' }
    ],
    instructions: [
      'Make roux with butter and flour, whisk in milk to make bechamel.',
      'Add cheese to make sauce.',
      'Cook pasta halfway.',
      'Combine pasta and sauce in hotel pans.',
      'Bake 15 mins, top with more cheese, bake 15 mins more.'
    ],
    pairingSuggestions: ['Steamed Broccoli', 'Dinner Roll']
  },
  {
    id: 'R018',
    name: 'Hummus Avocado Wrap',
    category: 'Entree',
    proteinType: 'Vegetarian',
    servingSize: '1 Wrap',
    servingDescription: '1 Wrap cut in half',
    ingredients: [
      { name: 'Garbanzo Beans', amount: '36 lbs' },
      { name: 'Avocado', amount: '7 lbs 15 oz' },
      { name: 'Cucumber', amount: '4 lbs 3 oz' },
      { name: 'WG Tortilla 9"', amount: '100 ea' },
      { name: 'Tahini', amount: '1 cup 9 tbsp' }
    ],
    instructions: [
      'Make hummus: Blend chickpeas, tahini, lemon, garlic, oil.',
      'Spread 3oz hummus on tortilla.',
      'Top with whole chickpeas, cucumber, tomato, avocado, and greens.',
      'Roll up and cut in half.'
    ],
    pairingSuggestions: ['Fresh Fruit', 'Yogurt']
  },
  {
    id: 'FS003',
    name: 'Baked Beef and Sausage Penne',
    category: 'Entree',
    proteinType: 'Beef',
    servingSize: '3/4 Cup',
    servingDescription: '3/4 Cup (8oz)',
    ingredients: [
      { name: 'Diced Tomatoes', amount: '1 2/3 #10 cans' },
      { name: 'Tomato Paste', amount: '6 oz' },
      { name: 'Olive Oil', amount: '6 1/2 Tbsp' },
      { name: 'Garlic', amount: '1 oz' },
      { name: 'Italian Spices', amount: 'Variable' },
      { name: 'Roasted Red Peppers', amount: '7 lbs' },
      { name: 'WG Penne Pasta', amount: '8 lbs' },
      { name: 'Ground Beef (85/15)', amount: '10 lbs' },
      { name: 'Italian Sausage', amount: '10 lbs' },
      { name: 'Parmesan Cheese', amount: '12 oz' },
      { name: 'Mozzarella Cheese', amount: '5 lbs 12 oz' }
    ],
    instructions: [
      'Make pizza sauce: Blend tomatoes with paste, oil, garlic, and spices.',
      'Drain and puree roasted red peppers.',
      'Cook pasta until halfway done and cool.',
      'Cook beef and sausage in tilt skillet for 30 mins to 165°F.',
      'Drain fat, add garlic, salt, and pepper puree.',
      'Mix pasta, meat, sauce, parm, and first mozzarella amount.',
      'Place 12lb 8oz per hotel pan, cover with parchment and foil.',
      'Bake covered at 350°F for 25 mins, add remaining mozzarella, bake 10 more mins.'
    ],
    pairingSuggestions: ['Garden Salad', 'Garlic Bread']
  },
  // Sides and Salads from PDF
  {
    id: 'OU006',
    name: 'Brussel Sprout Slaw',
    category: 'Side',
    proteinType: 'Vegetarian',
    servingSize: '1/2 Cup',
    servingDescription: '1/2 Cup (1.375oz)',
    ingredients: [
      { name: 'Brussels Sprouts (trimmed)', amount: '13 lbs 12 oz' },
      { name: 'Olive Oil', amount: '2 1/2 cups' },
      { name: 'Apple Cider Vinegar', amount: '1 cup 4 Tbsp' },
      { name: 'Salt', amount: '2 1/4 tsp' },
      { name: 'Honey', amount: '10 Tbsp' },
      { name: 'Dijon Mustard', amount: '10 Tbsp' }
    ],
    instructions: [
      'Clean, trim, and shred brussels sprouts.',
      'Whisk together olive oil, vinegar, salt, honey, and mustard.',
      'Combine dressing with shredded brussels sprouts and mix.'
    ],
    pairingSuggestions: ['Any protein entree']
  },
  {
    id: 'HK2277',
    name: 'Chili Roasted Sweet Potatoes',
    category: 'Side',
    proteinType: 'Vegetarian',
    servingSize: '1/2 Cup',
    servingDescription: '1/2 Cup',
    ingredients: [
      { name: 'Sweet Potatoes', amount: '22 lbs 3 oz' },
      { name: 'Chili Powder', amount: '5 Tbsp 2 tsp' },
      { name: 'Cumin', amount: '3 Tbsp' },
      { name: 'Garlic Powder', amount: '1 tsp' },
      { name: 'Salt', amount: '1 Tbsp' },
      { name: 'Olive Oil', amount: '1 cup' }
    ],
    instructions: [
      'Wash, peel, and cut sweet potatoes into 1 inch dice.',
      'Mix together all dry spices and whisk in oil.',
      'Toss potatoes with spice mixture to coat.',
      'Spread on parchment-lined sheet pans in single layer.',
      'Bake at 375°F for 15 mins until tender with crisp edges.'
    ],
    pairingSuggestions: ['Chicken dishes', 'Pork dishes']
  },
  {
    id: 'OU011',
    name: 'Cilantro Lime Rice',
    category: 'Side',
    proteinType: 'Vegetarian',
    servingSize: '1/2 Cup',
    servingDescription: '1/2 Cup (3oz)',
    ingredients: [
      { name: 'Cilantro', amount: '1 qt 1 cup' },
      { name: 'Brown Rice', amount: '6 lbs 4 oz' },
      { name: 'Water', amount: '2 gal 2 qt' },
      { name: 'Olive Oil', amount: '1 1/4 cup' },
      { name: 'Salt', amount: '6 Tbsp 2 tsp' },
      { name: 'Lime Juice', amount: '1 cup 4 Tbsp' }
    ],
    instructions: [
      'Chop the cilantro.',
      'Combine rice, water, and olive oil in hotel pan.',
      'Cover with parchment and foil, bake at 350°F for 45 mins.',
      'Combine cooked rice with salt, lime juice, and cilantro.'
    ],
    pairingSuggestions: ['Mexican entrees', 'Asian bowls']
  },
  {
    id: 'HK2231',
    name: 'Cool & Spicy Cucumber Salad',
    category: 'Side',
    proteinType: 'Vegetarian',
    servingSize: '1/2 Cup',
    servingDescription: '1/2 Cup (2.77oz)',
    ingredients: [
      { name: 'Roma Tomatoes', amount: '3 lbs 12 oz' },
      { name: 'Cilantro', amount: '1 oz' },
      { name: 'Cucumber', amount: '10 lbs' },
      { name: 'Green Onions', amount: '1 lb 14 oz' },
      { name: 'Red Pepper Flakes', amount: '3 Tbsp 1 tsp' },
      { name: 'Lemon Juice', amount: '1 lb 9 oz' }
    ],
    instructions: [
      'Large dice tomatoes, chop cilantro.',
      'Slice cucumbers and green onions.',
      'Combine tomatoes, red pepper flakes, green onions, cilantro, and lemon juice.',
      'Add cucumber slices and fold into mixture.',
      'Hold refrigerated at 40°F or below.'
    ],
    pairingSuggestions: ['Asian dishes', 'Grilled proteins']
  },
  {
    id: 'FS017',
    name: 'Corn Salad',
    category: 'Side',
    proteinType: 'Vegetarian',
    servingSize: '1/2 Cup',
    servingDescription: '1/2 Cup (3oz)',
    ingredients: [
      { name: 'Corn (frozen)', amount: '19 lbs 8 oz' },
      { name: 'Poblano Peppers', amount: '5 lbs' },
      { name: 'Red Onion', amount: '2 lbs' },
      { name: 'Red Pepper', amount: '3 lbs' },
      { name: 'Cilantro', amount: '8 oz' },
      { name: 'Lime Juice', amount: '1 cup' },
      { name: 'Salt', amount: '7 g' },
      { name: 'Coriander', amount: '1 Tbsp' }
    ],
    instructions: [
      'Defrost corn.',
      'Small dice all vegetables.',
      'Chop cilantro.',
      'Mix all ingredients together.'
    ],
    pairingSuggestions: ['Tacos', 'Burritos', 'Mexican entrees']
  },
  {
    id: 'SI513',
    name: 'Side Black Beans',
    category: 'Side',
    proteinType: 'Legumes',
    servingSize: '1/4 Cup',
    servingDescription: '1/4 Cup (2oz)',
    ingredients: [
      { name: 'Black Beans', amount: '21 lbs' },
      { name: 'Lime Juice', amount: '4 oz' },
      { name: 'Salsa', amount: '9 oz' },
      { name: 'Cumin', amount: '1 Tbsp' },
      { name: 'Salt', amount: '1 Tbsp' }
    ],
    instructions: [
      'Drain and rinse black beans.',
      'Mix all ingredients with beans.'
    ],
    pairingSuggestions: ['Mexican entrees', 'Rice dishes']
  },
  {
    id: 'SI298',
    name: 'Side Mexican Rice',
    category: 'Side',
    proteinType: 'Vegetarian',
    servingSize: '1/2 Cup',
    servingDescription: '1/2 Cup (4oz)',
    ingredients: [
      { name: 'Brown Rice', amount: '6 lbs 6 oz' },
      { name: 'Water', amount: '1 gal 1.5 qt' },
      { name: 'Salsa', amount: '7 lbs 6 oz' }
    ],
    instructions: [
      'Place rice and water in rice cooker (1:1 ratio).',
      'Cook until ready.',
      'Transfer to hotel pans, 7lb 13oz per pan.',
      'Mix rice with salsa (1 cup salsa per 1 quart rice).'
    ],
    pairingSuggestions: ['Tacos', 'Burritos', 'Enchiladas']
  }
];

export const getRecipeByName = (name: string): Recipe | undefined => {
  return recipes.find(r => r.name === name || r.name.includes(name));
};

export const getRecipesByProtein = (protein: string): Recipe[] => {
  return recipes.filter(r => r.proteinType === protein);
};
