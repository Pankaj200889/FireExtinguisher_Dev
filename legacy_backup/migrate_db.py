import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fire_safety.db')

def migrate():
    print(f"Connecting to database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(inspection)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'device_id' not in columns:
            print("Adding device_id column to inspection table...")
            cursor.execute("ALTER TABLE inspection ADD COLUMN device_id VARCHAR")
            conn.commit()
            print("Migration successful: device_id added.")
        else:
            print("Migration skipped: device_id already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
