from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, groups, expenses

app = FastAPI()

app.add_middleware( 
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(groups.router, prefix="/api/groups")
app.include_router(expenses.router, prefix="/api/expenses")
app.include_router(auth.router, prefix="/api/auth")