from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
print("Loading database module...")
from database import init_db
print("Loading routers...")
from routers import extinguishers, inspections, upload
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Lifespan starting...")
    try:
        init_db()
        print("Database initialized.")
    except Exception as e:
        print(f"Database init failed: {e}")
    yield
    print("Lifespan ending...")

print("Creating FastAPI app...")
app = FastAPI(title="Fire Extinguisher API (Rebuild)", lifespan=lifespan)

# Mount uploads directory to /static
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extinguishers.router)
app.include_router(inspections.router)
app.include_router(upload.router)
from routers import auth, settings, users
app.include_router(auth.router)
app.include_router(settings.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"status": "active", "message": "Backend Rebuild Successful"}
