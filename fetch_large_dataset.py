import urllib.request
import json
import pandas as pd
import ssl

def classify_diet(food_name, ingredients):
    text = (str(food_name) + " " + str(ingredients)).lower()
    non_veg_keywords = ['chicken', 'beef', 'pork', 'meat', 'fish', 'salmon', 'tuna', 'shrimp', 'bacon', 'sausage', 'turkey', 'lamb']
    for word in non_veg_keywords:
        if word in text:
            return 'Non-Vegetarian'
    return 'Vegetarian'

def classify_category(food_name):
    name = str(food_name).lower()
    breakfast_words = ['cereal', 'oat', 'pancake', 'egg', 'waffle', 'toast', 'bagel', 'yogurt', 'milk']
    snack_words = ['bar', 'chip', 'nut', 'almond', 'snack', 'cookie', 'biscuit', 'pretzel', 'chocolate', 'candy']
    lunch_words = ['sandwich', 'salad', 'wrap', 'soup', 'bread']
    
    for w in breakfast_words:
        if w in name: return 'Breakfast'
    for w in snack_words:
        if w in name: return 'Snack'
    for w in lunch_words:
        if w in name: return 'Lunch'
        
    return 'Dinner'

def download_openfoodfacts():
    print("Fetching real-world dataset from Open Food Facts API...")
    # Bypass SSL verification for local dev fallback
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    products = []
    for page in range(1, 5):
        url = f"https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=1000&page={page}"
        print(f"Fetching page {page} from OpenFoodFacts...")
        req = urllib.request.Request(url, headers={'User-Agent': 'NutraLab/1.0'})
        try:
            with urllib.request.urlopen(req, context=ctx) as response:
                data = json.loads(response.read().decode())
                products.extend(data.get('products', []))
        except Exception as e:
            print("Pagination complete or error:", e)
            break
            
    print(f"Downloaded {len(products)} raw products. Cleaning and formatting data...")
    
    dataset = []
    seen = set()
    
    for p in products:
        name = p.get('product_name')
        if not name or name in seen:
            continue
            
        nutriments = p.get('nutriments', {})
        
        # Get valid macros
        calories = nutriments.get('energy-kcal_100g')
        protein = nutriments.get('proteins_100g')
        carbs = nutriments.get('carbohydrates_100g')
        fats = nutriments.get('fat_100g')
        
        # Only accept items with complete nutritional info
        if all(x is not None for x in [calories, protein, carbs, fats]):
            # Filter out crazy outliers (like raw oil that messes up meals)
            if calories > 0 and calories < 800:
                diet_type = classify_diet(name, p.get('ingredients_text', ''))
                category = classify_category(name)
                
                water_multiplier = 2.5 if category in ["Lunch", "Dinner"] else 1.8
                base_weight = round((float(protein) + float(carbs) + float(fats)) * water_multiplier)
                recipe = f"Standard preparation required. For optimal flavor profile, consume {name.title().strip()} as directed by packaging."
                
                dataset.append({
                    "FoodItem": name.title().strip().replace(',', ''),
                    "Category": category,
                    "Calories": round(float(calories), 1),
                    "Protein(g)": round(float(protein), 1),
                    "Carbs(g)": round(float(carbs), 1),
                    "Fats(g)": round(float(fats), 1),
                    "DietType": diet_type,
                    "Recipe": recipe,
                    "BaseWeight(g)": max(1, base_weight)
                })
                seen.add(name)
                
    df = pd.DataFrame(dataset)
    df.to_csv('data/food_dataset.csv', index=False)
    print(f"Successfully generated clean dataset with {len(df)} items! Saved to data/food_dataset.csv")

if __name__ == "__main__":
    download_openfoodfacts()
