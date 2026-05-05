from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, groups

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(groups.router, prefix="/api/groups")  