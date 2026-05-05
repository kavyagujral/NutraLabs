from sqlalchemy import Column, Integer, String, Float
from database import Base
from pydantic import BaseModel
from typing import Optional, List

# -----------------
# SQLAlchemy DB Models
# -----------------

class DBUser(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    age = Column(Integer)
    gender = Column(String) # 'Male' or 'Female'
    height_cm = Column(Float)
    weight_kg = Column(Float)
    activity_level = Column(String) # 'Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'


# -----------------
# Pydantic Schemas (Data Transfer Objects)
# -----------------

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    activity_level: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class DietRequest(BaseModel):
    goal: str # 'Maintenance', 'Fat Loss', 'Muscle Gain'
    diet_preference: Optional[str] = "Any" # 'Vegetarian', 'Non-Vegetarian', 'Any'
    include_foods: Optional[str] = "" # comma-separated foods to include
    exclude_foods: Optional[str] = "" # comma-separated foods to exclude

class FoodBasedDietRequest(BaseModel):
    goal: str
    available_foods: List[str]
    diet_preference: Optional[str] = "Any"

class IngredientRequest(BaseModel):
    ingredient: str
    goal: str

class LLMRequest(BaseModel):
    query: str

class ConfirmedFoodItem(BaseModel):
    name: str
    portion: str

class FetchNutritionRequest(BaseModel):
    items: List[ConfirmedFoodItem]
