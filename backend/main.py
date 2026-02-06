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
        
        # Soft Delete (Phase 6.9)
        # Soft Delete (Phase 6.9)
        # Robust Migration for both Postgres (DEFAULT TRUE) and SQLite (DEFAULT 1)
        
        def safe_add_is_active(table_name):
            try:
                # Try Postgres Syntax first (standard)
                conn.execute(text(f'ALTER TABLE {table_name} ADD COLUMN is_active BOOLEAN DEFAULT TRUE'))
                print(f"Added is_active to {table_name} (Postgres)")
            except Exception:
                try:
                    # Fallback to SQLite Syntax (DEFAULT 1, no IF NOT EXISTS support usually needed if we catch error)
                    conn.execute(text(f'ALTER TABLE {table_name} ADD COLUMN is_active BOOLEAN DEFAULT 1'))
                    print(f"Added is_active to {table_name} (SQLite)")
                except Exception:
                    # Likely already exists
                    pass

        safe_add_is_active('"user"')
        safe_add_is_active("extinguisher")

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

# Emergency endpoint MUST be defined after app is created
@app.get("/debug/fix-db")
def fix_db():
    """
    Emergency endpoint to manually trigger database repair.
    """
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.begin()
            # SQLite safe: No IF NOT EXISTS, catch duplicate column error
            try:
                conn.execute(text('ALTER TABLE "user" ADD COLUMN is_active BOOLEAN DEFAULT 1'))
            except Exception:
                pass
                
            try:
                conn.execute(text("ALTER TABLE extinguisher ADD COLUMN is_active BOOLEAN DEFAULT 1"))
            except Exception:
                pass
                
            conn.commit()
        return {"status": "SUCCESS", "message": "Database repaired. Columns 'is_active' added (SQLite Mode)."}
    except Exception as e:
        return {"status": "ERROR", "detail": str(e)}

@app.get("/debug/create-admin")
def create_initial_admin():
    """
    Emergency endpoint to create the first Admin user.
    Only works if no users exist in the database.
    Default: admin / admin123
    """
    try:
        from models import User
        from auth import get_password_hash
        from sqlmodel import Session, select
        
        with Session(engine) as session:
            # check if any user exists
            existing = session.exec(select(User)).first()
            if existing:
                return {"status": "SKIPPED", "message": "Users already exist. Cannot overwrite."}
            
            # Create Admin
            admin_user = User(
                username="admin", 
                password_hash=get_password_hash("admin123"), # Default password
                role="admin",
                is_active=True
            )
            session.add(admin_user)
            session.commit()
            return {"status": "SUCCESS", "message": "Admin user created. Login with: admin / admin123"}
    except Exception as e:
        return {"status": "ERROR", "detail": str(e)}

# Mount uploads directory to /static
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Must be False if origins is "*"
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
