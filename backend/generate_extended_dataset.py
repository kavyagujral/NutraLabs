import pandas as pd
import random

# Core items with base macros (Calories, Protein, Carbs, Fats, DietType, Category)
core_items = [
    ("Oatmeal", 150, 5, 27, 3, "Vegetarian", "Breakfast"),
    ("Pancakes", 250, 6, 35, 10, "Vegetarian", "Breakfast"),
    ("Greek Yogurt", 100, 10, 4, 0, "Vegetarian", "Breakfast"),
    ("Scrambled Eggs", 140, 12, 1, 10, "Non-Vegetarian", "Breakfast"),
    ("Bacon Strips", 130, 9, 0, 10, "Non-Vegetarian", "Breakfast"),
    ("Protein Waffle", 220, 15, 20, 8, "Vegetarian", "Breakfast"),
    ("Avocado Toast", 250, 6, 24, 15, "Vegetarian", "Breakfast"),
    ("Fruit Smoothie", 180, 2, 45, 1, "Vegetarian", "Breakfast"),
    ("Cereal with Milk", 210, 8, 35, 4, "Vegetarian", "Breakfast"),
    ("Tofu Scramble", 160, 14, 4, 10, "Vegetarian", "Breakfast"),

    ("Chicken Breast", 165, 31, 0, 3, "Non-Vegetarian", "Lunch"),
    ("Salmon Fillet", 400, 34, 0, 28, "Non-Vegetarian", "Dinner"),
    ("Steak", 500, 40, 0, 35, "Non-Vegetarian", "Dinner"),
    ("Turkey Wrap", 350, 25, 35, 12, "Non-Vegetarian", "Lunch"),
    ("Tuna Salad", 300, 28, 10, 15, "Non-Vegetarian", "Lunch"),
    ("Brown Rice", 215, 5, 45, 1, "Vegetarian", "Lunch"),
    ("White Rice", 205, 4, 44, 0, "Vegetarian", "Lunch"),
    ("Quinoa", 220, 8, 39, 3, "Vegetarian", "Lunch"),
    ("Sweet Potato", 110, 2, 26, 0, "Vegetarian", "Dinner"),
    ("Mashed Potatoes", 210, 4, 30, 8, "Vegetarian", "Dinner"),
    ("Black Beans", 110, 7, 20, 0, "Vegetarian", "Lunch"),
    ("Lentil Soup", 180, 10, 30, 2, "Vegetarian", "Dinner"),
    ("Tofu", 140, 15, 2, 8, "Vegetarian", "Lunch"),
    ("Paneer", 320, 18, 5, 25, "Vegetarian", "Dinner"),
    ("Chickpea Curry", 300, 12, 40, 10, "Vegetarian", "Dinner"),
    ("Mixed Dal", 220, 14, 35, 4, "Vegetarian", "Lunch"),
    ("Chia Seed Pudding", 190, 8, 20, 10, "Vegetarian", "Breakfast"),
    ("Protein Smoothie", 200, 25, 15, 3, "Vegetarian", "Breakfast"),
    ("Scrambled Egg Whites", 120, 22, 2, 0, "Non-Vegetarian", "Breakfast"),
    
    # Lunch/Dinner
    ("Chicken Shawarma", 450, 30, 40, 18, "Non-Vegetarian", "Lunch"),
    ("Steak and Rice", 600, 40, 45, 25, "Non-Vegetarian", "Dinner"),
    ("Paneer Tikka", 350, 18, 12, 25, "Vegetarian", "Dinner"),
    ("Caesar Salad", 300, 10, 15, 22, "Vegetarian", "Lunch"),
    ("Tuna Sandwich", 400, 28, 35, 15, "Non-Vegetarian", "Lunch"),
    ("Lentil Soup", 200, 12, 25, 3, "Vegetarian", "Lunch"),
    ("Baked Salmon", 450, 35, 10, 28, "Non-Vegetarian", "Dinner"),
    ("Chicken Breast & Broccoli", 250, 35, 10, 5, "Non-Vegetarian", "Lunch"),
    ("Beef Stir Fry", 480, 32, 35, 20, "Non-Vegetarian", "Dinner"),
    ("Quinoa Bowl", 320, 14, 45, 10, "Vegetarian", "Lunch"),
    ("Turkey Wrap", 350, 25, 30, 12, "Non-Vegetarian", "Lunch"),
    ("Pork Chop & Mash", 550, 35, 40, 25, "Non-Vegetarian", "Dinner"),
    ("Vegetable Curry", 300, 8, 30, 15, "Vegetarian", "Dinner"),
    ("Shrimp Pasta", 480, 30, 55, 12, "Non-Vegetarian", "Dinner"),
    
    # Snacks
    ("Apple", 95, 0.5, 25, 0.3, "Vegetarian", "Snack"),
    ("Protein Bar", 200, 20, 22, 6, "Vegetarian", "Snack"),
    ("Almonds", 160, 6, 6, 14, "Vegetarian", "Snack"),
    ("Cottage Cheese", 120, 14, 5, 4, "Vegetarian", "Snack"),
    ("Banana", 105, 1, 27, 0, "Vegetarian", "Snack"),
    ("Hummus & Carrots", 150, 5, 18, 8, "Vegetarian", "Snack"),
    ("Edamame", 120, 11, 10, 5, "Vegetarian", "Snack"),
    ("Peanut Butter Toast", 220, 8, 20, 12, "Vegetarian", "Snack"),
    ("Rice Cakes", 80, 2, 16, 0, "Vegetarian", "Snack"),
    ("Boiled Eggs", 140, 12, 1, 10, "Non-Vegetarian", "Snack")
]

# Modifiers to procedurally explode the dataset array (Flavor, Cals_Mult, Pro_Mult, Carb_Mult, Fat_Mult)
modifiers = [
    ("Spicy", 1.05, 1.0, 1.1, 1.05),
    ("Garlic", 1.1, 1.05, 1.2, 1.1),
    ("Cheesy", 1.4, 1.2, 1.1, 1.6),
    ("Herb-Roasted", 1.15, 1.05, 1.05, 1.2),
    ("BBQ", 1.3, 1.0, 1.5, 1.1),
    ("Teriyaki", 1.25, 1.05, 1.6, 1.0),
    ("Extra Lean", 0.8, 1.2, 1.0, 0.5),
    ("Keto", 0.9, 1.1, 0.2, 1.8),
    ("Honey Glazed", 1.35, 1.0, 1.8, 1.1),
    ("Lemon Pepper", 1.02, 1.05, 1.0, 1.0),
    ("Buttermilk", 1.4, 1.1, 1.2, 1.5),
    ("Loaded", 1.6, 1.3, 1.5, 1.8),
    ("Smoked", 1.1, 1.1, 1.0, 1.2),
    ("Chipotle", 1.2, 1.05, 1.1, 1.3),
    ("Cajun", 1.15, 1.0, 1.1, 1.15),
    ("Sweet & Sour", 1.3, 1.0, 1.7, 1.0)
]

def make_recipe(name, cat):
    nl = name.lower()
    if 'paneer' in nl or 'tofu' in nl:
        return f"1. Cube the {name}. 2. Toss in a pan with 1 tsp oil and your favorite spices. 3. Sauté on medium heat for 10-15 mins until golden brown. Serve hot!"
    elif 'chicken' in nl or 'steak' in nl or 'pork' in nl or 'salmon' in nl:
        return f"1. Preheat grill or skillet. 2. Season the {name} to your liking. 3. Cook over medium-high heat for roughly 6-8 mins per side until the internal temperature is safe. 4. Rest for 5 mins before slicing."
    elif 'rice' in nl or 'quinoa' in nl:
        return f"1. Rinse thoroughly. 2. Boil 2 cups of water for every 1 cup of {name}. 3. Simmer covered for 15-20 mins until fluffy."
    elif cat == 'Breakfast':
        return f"1. Prepare the {name} base ingredients. 2. Warm up a pan over medium heat. 3. Cook for a few minutes until beautifully set and golden. 4. Plate nicely to start your day!"
    elif cat == 'Snack':
        return f"1. Simply portion out your {name}. 2. Store the rest in an airtight container for lasting freshness."
    else:
        return f"1. Gather your {name} ingredients. 2. Sauté or bake in the oven at 375°F (190°C) until thoroughly warmed and aromatic. 3. Plate and garnish."

dataset = []

for name, cals, pro, carb, fat, diet, cat in core_items:
    recipe = make_recipe(name, cat)
    # Estimate raw weight (Macros + Water Weight). Dinners have more water weight than dry snacks.
    water_multiplier = 2.5 if cat in ["Lunch", "Dinner"] else 1.8
    base_weight = round((pro + carb + fat) * water_multiplier)
    dataset.append([name, cat, cals, pro, carb, fat, diet, recipe, base_weight])

for name, cals, pro, carb, fat, diet, cat in core_items:
    # We apply modifiers to EVERYTHING now to generate a massive array of items (e.g. Spicy Almonds, Keto Honey Glazed Salmon)
    selected_mods = random.sample(modifiers, k=random.randint(6, 12))
    for mod_name, c_mult, p_mult, cb_mult, f_mult in selected_mods:
        new_name = f"{mod_name} {name}"
        if new_name not in [x[0] for x in dataset]:
            recipe = make_recipe(new_name, cat)
            
            final_pro, final_carb, final_fat = round(pro * p_mult, 1), round(carb * cb_mult, 1), round(fat * f_mult, 1)
            final_cals = round(cals * c_mult, 1)
            
            # Accurately derive total weight based on resulting macros
            final_weight = round((final_pro + final_carb + final_fat) * 2.5)
            
            dataset.append([
                new_name, cat,
                final_cals, final_pro, final_carb, final_fat,
                diet, recipe, max(1, final_weight)
            ])

df = pd.DataFrame(dataset, columns=["FoodItem", "Category", "Calories", "Protein(g)", "Carbs(g)", "Fats(g)", "DietType", "Recipe", "BaseWeight(g)"])
df = df.sample(frac=1, random_state=42).reset_index(drop=True)
df.to_csv("data/food_dataset.csv", index=False)
print(f"Generated {len(df)} items WITH Recipes successfully in data/food_dataset.csv!")
