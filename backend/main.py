from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from sqlalchemy import text
print("Loading database module...")
from database import init_db, engine
print("Loading routers...")
from routers import extinguishers, inspections, upload
import os

def run_migrations():
    """
    Dirty migration script to add missing columns for Phase 6.6.
    Safe for SQLite and Postgres (mostly).
    """
    print("Running migrations...")
    with engine.connect() as conn:
        conn.begin()
        
        # Helper to try add column
        def add_col(table, col_def):
            try:
                # Postgres supports IF NOT EXISTS, SQLite does not in standard ADD COLUMN (but ignores if duplicate usually or errors)
                # We try standard SQL. If it fails, we assume it exists.
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_def}"))
                print(f"Added {col_def} to {table}")
            except Exception as e:
                # print(f"Skipping {col_def} on {table}: {e}")
                pass

        # Extinguisher Columns
        add_col("extinguisher", "hydro_pressure_tested_on TIMESTAMP")
        add_col("extinguisher", "next_hydro_pressure_test_due TIMESTAMP")
        
        # Inspection Columns
        add_col("inspection", "hydro_pressure_tested_on TIMESTAMP")
        add_col("inspection", "next_hydro_pressure_test_due TIMESTAMP")
        add_col("inspection", "pressure_tested_on TIMESTAMP")
        add_col("inspection", "date_of_discharge TIMESTAMP")
        add_col("inspection", "refilled_on TIMESTAMP")
        add_col("inspection", "due_for_refilling TIMESTAMP") # Explicit field added recently if missing

        # CompanySettings
        add_col("companysettings", "timezone VARCHAR DEFAULT 'Asia/Kolkata'")
        
        conn.commit()
    print("Migrations complete.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Lifespan starting...")
    try:
        init_db()
        run_migrations()
        print("Database initialized and migrated.")
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
    return {"status": "active", "message": "Backend Rebuild Successful with Migrations"}
