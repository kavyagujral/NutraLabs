import asyncio
from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.testclient import TestClient

app = FastAPI()

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    return {"user": form_data.username}

client = TestClient(app)

res = client.post("/login", data={"username": "test@gmail.com", "password": "123"})
print(res.json())
