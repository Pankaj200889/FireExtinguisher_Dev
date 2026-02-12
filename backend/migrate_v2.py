import sqlite3
import os

DB_PATH = "fire_safety.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found. Skipping migration (it will be created fresh).")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Columns to add
    new_columns = [
        ("observation", "TEXT DEFAULT 'Ok'"),
        ("pressure_tested_on", "DATETIME"),
        ("date_of_discharge", "DATETIME"),
        ("refilled_on", "DATETIME"),
        ("due_for_refilling", "DATETIME")
    ]
    
    print("Checking for missing columns...")
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(inspection)")
    existing_columns = [row[1] for row in cursor.fetchall()]
    
    for col_name, col_type in new_columns:
        if col_name not in existing_columns:
            print(f"Adding missing column: {col_name}")
            try:
                cursor.execute(f"ALTER TABLE inspection ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")
            
    conn.commit()
    conn.close()
    print("Migration Check Complete.")

if __name__ == "__main__":
    migrate()
