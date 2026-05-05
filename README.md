# NutraLab Backend System

NutraLab is a machine learning-based diet recommendation system that suggests personalized diet plans based on:
1. User fitness goals (Maintenance, Muscle Gain, Fat Loss).
2. Available food items (system generates a diet plan using only those items).

## Tech Stack
- **Framework:** FastAPI (Python)
- **Database:** SQLite & SQLAlchemy
- **Authentication:** JWT (JSON Web Tokens)
- **Machine Learning:** `scikit-learn` (K-Nearest Neighbors Algorithm)
- **Data:** `pandas`

## Folder Structure
```
/NutraLab
├── main.py             # FastAPI entry point and all API routes
├── database.py         # SQLite & SQLAlchemy DB setup
├── models.py           # DB Schemas and Pydantic validation DTOs
├── utils.py            # Mathematical functions (BMI, TDEE) and Password Hashing
├── ml_model.py         # KNN Model for recommending foods based on macro targets
├── requirements.txt    # Python dependencies
├── nutralab.db         # Automatically generated SQLite DB (after running server)
└── data/
    └── food_dataset.csv # Sample dataset containing food items and their macros
```

## How to Run Locally

1. **Activate the Virtual Environment**
   ```bash
   source .venv/bin/activate
   ```
   *(If you are on Windows PowerShell, use `.venv\Scripts\activate`)*

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the Development Server**
   ```bash
   uvicorn main:app --reload
   ```

4. **View Automatic Interactive Docs (Swagger)**
   Open your browser and navigate to:
   [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   *You can test all APIs directly from this page without Postman!*

---

## Testing via Postman (API Documentation)

### 1. Signup (`POST /signup`)
Create a new user.
- **URL:** `http://127.0.0.1:8000/signup`
- **Body (JSON):**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secretpassword",
  "age": 25,
  "gender": "Female",
  "height_cm": 165,
  "weight_kg": 60,
  "activity_level": "moderate"
}
```

### 2. Login (`POST /login`)
Authenticate to get a JWT token.
- **URL:** `http://127.0.0.1:8000/login`
- **Body (JSON):**
```json
{
  "email": "jane@example.com",
  "password": "secretpassword"
}
```
**Important:** Copy the `access_token` from the response. For the next endpoints, you must include this token in the Headers:
`Authorization: Bearer <your_access_token>`

### 3. Calculate Diet (`POST /calculate-diet`)
Generate a personalized diet based on user data and fitness goal.
- **URL:** `http://127.0.0.1:8000/calculate-diet`
- **Headers:** `Authorization: Bearer <token>`
- **Body (JSON):**
```json
{
  "goal": "Fat Loss"
}
```

### 4. Recommend from Specific Foods (`POST /recommend-from-foods`)
Generate a diet plan strictly using ingredients the user already has at home.
- **URL:** `http://127.0.0.1:8000/recommend-from-foods`
- **Headers:** `Authorization: Bearer <token>`
- **Body (JSON):**
```json
{
  "goal": "Maintenance",
  "available_foods": [
    "Oatmeal",
    "Banana",
    "Grilled Chicken Breast",
    "Quinoa Salad",
    "Steak and Sweet Potato",
    "Shrimp Tacos",
    "Almonds (handful)"
  ]
}
```

## How the ML Works (Explanation)
The system leverages a **K-Nearest Neighbors (KNN)** approach through `scikit-learn`:
1. It calculates the user's Total Daily Energy Expenditure (TDEE) using the Mifflin-St Jeor equation.
2. It breaks the user's Caloric Goal into 4 distinct Macro Targets (Calories, Protein, Carbs, Fats) divided across meals (Breakfast, Lunch, Dinner, Snack).
3. The dataset is parsed using `pandas`. If the user inputs `available_foods`, the dataframe is filtered to *only* contain those rows.
4. The KNN algorithm (`NearestNeighbors`) treats each food item as a vector in a 4-dimensional space (Cal, Pro, Carb, Fat).
5. We input our target "Meal Macro Vector" to the Model, and the KNN finds the closest fitting food item in the dataset to act as the meal recommendation!

## Future Improvements & Frontend Suggestion
- **Frontend Suggestion:** A **React (Vite) Single Page Application** would pair perfectly with this FastAPI backend since React is great at handling state and JSON data from HTTP requests. Alternatively, plain HTML/CSS with JavaScript `fetch()` calls would also work for a very simple frontend.
- **Dataset Expansion:** Extend the CSV to contain thousands of items.
- **Macro Scaling:** Currently, it tries to match portions logically, but an Optimization ML model (like Linear Programming with SciPy) could perfect the portion sizing to precisely hit the macros down to the gram.
