from sqlmodel import Session, select
from database import engine, init_db
from models import User, Extinguisher
from auth import get_password_hash
import uuid

def seed():
    init_db()
    with Session(engine) as session:
        # Check if user exists
        user = session.exec(select(User).where(User.username == "inspector")).first()
        if not user:
            user = User(
                username="inspector",
                password_hash=get_password_hash("password"),
                role="inspector"
            )
            session.add(user)
            print("Created inspector user")

        # Create Admin User
        admin = session.exec(select(User).where(User.username == "admin")).first()
        if not admin:
            admin = User(
                username="admin",
                password_hash=get_password_hash("admin"),
                role="admin"
            )
            session.add(admin)
            print("Created admin user")


        # Create Test Extinguisher
        ext_id = uuid.UUID("12345678-1234-5678-1234-567812345678")
        ext = session.get(Extinguisher, ext_id)
        if not ext:
            ext = Extinguisher(
                id=ext_id,
                sl_no="TEST-001",
                type="CO2",
                capacity="4.5KG",
                location="Server Room",
                make="FireSafe",
                year_of_manufacture=2024
            )
            session.add(ext)
            print(f"Created Test Extinguisher: {ext_id}")
            
        session.commit()

if __name__ == "__main__":
    seed()
