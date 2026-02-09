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
        add_col("inspection", "refilled_on TIMESTAMP")
        add_col("inspection", "due_for_refilling TIMESTAMP") # Explicit field added recently if missing
        
        # Phase 6.10: Missing Audit Columns
        add_col("inspection", "observation VARCHAR DEFAULT 'Ok'")
        add_col("inspection", "remarks VARCHAR")
        add_col("inspection", "device_id VARCHAR")
        add_col("inspection", "photo_path VARCHAR")
        add_col("inspection", "signature_path VARCHAR")

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
        
        # Phase 6.11: Sortable Lists (created_at)
        # Postgres uses NOW(), SQLite uses CURRENT_TIMESTAMP
        # We try Postgres first
        try:
             conn.execute(text('ALTER TABLE "user" ADD COLUMN created_at TIMESTAMP DEFAULT NOW()'))
             print("Added created_at to user (Postgres)")
        except:
             try:
                 conn.execute(text('ALTER TABLE "user" ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
                 print("Added created_at to user (SQLite)")
             except:
                 pass

        try:
             conn.execute(text("ALTER TABLE extinguisher ADD COLUMN created_at TIMESTAMP DEFAULT NOW()"))
             print("Added created_at to extinguisher (Postgres)")
        except:
             try:
                 conn.execute(text("ALTER TABLE extinguisher ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
                 print("Added created_at to extinguisher (SQLite)")
             except:
                 pass

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

@app.get("/debug/fix-schema")
def fix_schema_created_at():
    """
    Emergency: Add created_at column if migration failed.
    """
    results = []
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.begin()
            
            # 1. User Table
            try:
                # Try Postgres
                conn.execute(text('ALTER TABLE "user" ADD COLUMN created_at TIMESTAMP DEFAULT NOW()'))
                results.append("Added created_at to User (Postgres)")
            except Exception as e_pg:
                # Try SQLite
                try:
                    conn.execute(text('ALTER TABLE "user" ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
                    results.append("Added created_at to User (SQLite)")
                except Exception as e_sq:
                    results.append(f"User Failed: {e_pg} | {e_sq}")

            # 2. Extinguisher Table
            try:
                # Try Postgres
                conn.execute(text('ALTER TABLE extinguisher ADD COLUMN created_at TIMESTAMP DEFAULT NOW()'))
                results.append("Added created_at to Extinguisher (Postgres)")
            except Exception as e_pg:
                # Try SQLite
                try:
                    conn.execute(text('ALTER TABLE extinguisher ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
                    results.append("Added created_at to Extinguisher (SQLite)")
                except Exception as e_sq:
                    results.append(f"Extinguisher Failed: {e_pg} | {e_sq}")
            
            conn.commit()
            
        return {"status": "DONE", "details": results}

    except Exception as e:
        return {"status": "CRITICAL_ERROR", "detail": str(e)}

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
    allow_origins=[
        "http://localhost:3000",
        "https://fire-safety-dev.vercel.app",
        "https://fire.siddhiss.com",
        "https://fire-safety-h73i0y5bh-pankaj-vishwakarmas-projects-816b85f5.vercel.app"
    ],
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
