from fastapi import FastAPI
import os
from database import init_db
from contextlib import asynccontextmanager
from routes import auth_routes, extinguisher_routes, upload_routes, inspection_routes, websocket_routes, settings_routes, reports_routes, audit_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown
    pass

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Fire Extinguisher Management System",
    description="API for managing fire safety compliance (IS 2190:2024)",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

# Helper to remove trailing slash if present
if frontend_url and frontend_url.endswith("/"):
    origins.append(frontend_url[:-1])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(extinguisher_routes.router)
app.include_router(upload_routes.router)
app.include_router(inspection_routes.router)
app.include_router(settings_routes.router)
app.include_router(reports_routes.router)
app.include_router(audit_routes.router)
app.include_router(websocket_routes.router)

from fastapi.staticfiles import StaticFiles
os.makedirs("backend/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="backend/uploads"), name="static")

@app.get("/")
def read_root():
    return {"message": "Fire Extinguisher API is running", "status": "active"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
