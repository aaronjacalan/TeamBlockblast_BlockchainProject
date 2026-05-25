from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, groups, expenses, notifications, blockchain

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
app.include_router(notifications.router, prefix="/api/notifications")
app.include_router(blockchain.router, prefix="/api/blockchain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
