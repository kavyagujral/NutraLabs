import json
import requests
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"

def _call_ollama(prompt: str) -> dict:
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=90)
        response.raise_for_status()
        data = response.json()
        raw_text = data.get("response", "")
        # Parse JSON output from the LLM
        return json.loads(raw_text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse the response format from the AI Model. Please try again."}
    except requests.exceptions.ConnectionError:
        return {"error": "Ollama service is unreachable. Ensure 'ollama run llama3' is active."}
    except Exception as e:
        return {"error": f"LLM Generation Error: {str(e)}"}


def generate_diet_plan(target_calories: float, target_protein: float, target_carbs: float, target_fats: float, available_foods: list = None, diet_preference: str = "Any"):
    """
    Given a user's total daily macro targets, generates a recommended meal plan (Breakfast, Lunch, Snack, Dinner) using Ollama.
    """
    foods_constraint = ""
    if available_foods and len(available_foods) > 0:
        foods_constraint = f"You MUST use ONLY these available foods: {', '.join(available_foods)}."
        
    prompt = f"""
You are an expert mathematical nutritionist. Generate a perfectly balanced daily meal plan.
Target Macros: {target_calories} kcal, {target_protein}g Protein, {target_carbs}g Carbs, {target_fats}g Fats.
Diet Preference Constraint: {diet_preference}
{foods_constraint}

You must return a strictly valid JSON object matching exactly this schema, balancing the targets across the 4 meals. 
Return ONLY JSON, no markdown blocks.
{{
  "daily_plan": [
    {{
      "Meal": "Breakfast",
      "Category": "Breakfast",
      "Options": [
        {{
          "FoodItem": "String",
          "Portions": 1.0,
          "Grams_Provided": 150,
          "Calories_Provided": 300,
          "Protein_Provided": 20,
          "Carbs_Provided": 30,
          "Fats_Provided": 10
        }}
      ]
    }},
    {{ "Meal": "Lunch", "Category": "Lunch", "Options": [] }},
    {{ "Meal": "Snack", "Category": "Snack", "Options": [] }},
    {{ "Meal": "Dinner", "Category": "Dinner", "Options": [] }}
  ],
  "total_nutrition_provided": {{
      "Calories": {target_calories},
      "Protein(g)": {target_protein},
      "Carbs(g)": {target_carbs},
      "Fats(g)": {target_fats}
  }}
}}
"""
    return _call_ollama(prompt)

def find_best_recipe_for_ingredient(ingredient: str, target_calories: float, target_protein: float, target_carbs: float, target_fats: float, goal: str):
    """
    Finds the exact best matching food variations via LLM generative cooking.
    """
    prompt = f"""
You are a culinary generative AI. Provide the 3 absolute best custom recipe variations for the core ingredient "{ingredient}".
Optimize the recipes for the fitness goal: "{goal}".
The recipes must correspond to a single meal equating to roughly 30% of the daily total macros (Target constraints for this dish: {target_calories * 0.3} kcal).

You must return a strictly valid JSON object matching exactly this schema. Return ONLY JSON, no markdown blocks.
{{
  "Goal_Optimized_For": "{goal}",
  "Recipes": [
    {{
      "Recommended_Dish": "String",
      "Serving_Multiplier": 1.0,
      "Grams_Provided": 200,
      "Macros_Provided": {{
          "Calories": 400.0,
          "Protein(g)": 30.0,
          "Carbs(g)": 40.0,
          "Fats(g)": 15.0
      }},
      "Cooking_Recipe": "String (Short step-by-step instructions)"
    }}
  ]
}}
"""
    return _call_ollama(prompt)
