import os
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt

# ----------------- #
# AUTHENTICATION    #
# ----------------- #

SECRET_KEY = "super_secret_nutralab_key" # In production, set this as environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days locally

def verify_password(plain_password, hashed_password):
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)

def get_password_hash(password):
    # bcrypt module returns bytes, so we decode it to store as a string in DB
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

from typing import Optional

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ----------------- #
# HEALTH MATH LOGIC #
# ----------------- #

def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2)
    return round(bmi, 2)

def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """ Mifflin-St Jeor Equation """
    if gender.lower() == 'male':
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    else:
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161

def calculate_tdee(bmr: float, activity_level: str) -> float:
    activity_multipliers = {
        'sedentary': 1.2, # Little or no exercise
        'light': 1.375,   # Light exercise/sports 1-3 days/week
        'moderate': 1.55, # Moderate exercise/sports 3-5 days/week
        'active': 1.725,  # Hard exercise/sports 6-7 days a week
        'very active': 1.9# Very hard exercise/sports & physical job
    }
    multiplier = activity_multipliers.get(activity_level.lower(), 1.2)
    return bmr * multiplier

def calculate_target_macros(tdee: float, goal: str, weight_kg: float, activity_level: str = "moderate") -> dict:
    """
    Returns Target Calories, Protein, Carbs, Fats, and Fiber.
    Goal can be: 'Maintenance', 'Fat Loss', 'Muscle Gain'
    Protein and Fats scale with activity level + goal per provided tables.
    """
    target_calories = tdee
    goal_normalized = goal.lower()

    if "loss" in goal_normalized:
        target_calories -= 500
    elif "gain" in goal_normalized:
        target_calories += 500

    # Matrix: Activity x Goal -> g per kg bodyweight
    protein_matrix = {
        "sedentary": {"maintenance": 1.2, "fat loss": 1.6, "muscle gain": 1.6},
        "light":     {"maintenance": 1.4, "fat loss": 1.8, "muscle gain": 1.8},
        "moderate":  {"maintenance": 1.6, "fat loss": 2.0, "muscle gain": 2.0},
        "active":    {"maintenance": 1.8, "fat loss": 2.2, "muscle gain": 2.2},
    }
    
    fat_matrix = {
        "sedentary": {"maintenance": 0.8, "fat loss": 0.6, "muscle gain": 0.8},
        "light":     {"maintenance": 0.9, "fat loss": 0.7, "muscle gain": 0.9},
        "moderate":  {"maintenance": 1.0, "fat loss": 0.8, "muscle gain": 1.0},
        "active":    {"maintenance": 1.0, "fat loss": 0.8, "muscle gain": 1.0},
    }

    activity_key = activity_level.lower().strip()
    if activity_key not in protein_matrix:
        activity_key = "moderate"

    goal_key = "maintenance"
    if "loss" in goal_normalized:
        goal_key = "fat loss"
    elif "gain" in goal_normalized:
        goal_key = "muscle gain"

    # Protein calc
    protein_mult = protein_matrix[activity_key][goal_key]
    protein_g  = weight_kg * protein_mult
    protein_cals = protein_g * 4

    # Fats calc (instead of fixed 25%)
    fat_mult = fat_matrix[activity_key][goal_key]
    fats_g = weight_kg * fat_mult
    fats_cals = fats_g * 9

    # Carbs calc (remaining calories)
    carbs_cals = target_calories - protein_cals - fats_cals
    if carbs_cals < 0:
        carbs_cals = 0  # Failsafe
    carbs_g = carbs_cals / 4
    
    # Fiber (10-15g per 1000 kcal, let's use 12.5g average)
    fiber_g = (target_calories / 1000) * 12.5

    return {
        "calories":  round(target_calories, 2),
        "protein_g": round(protein_g, 2),
        "carbs_g":   round(carbs_g, 2),
        "fats_g":    round(fats_g, 2),
        "fiber_g":   round(fiber_g, 1)
    }
