from sqlmodel import Session, select
from database import engine, init_db
from models import User
from sqlmodel import Session, select
from database import engine, init_db
from models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def seed_users():
    init_db()
    with Session(engine) as session:
        # Check if admin exists
        statement = select(User).where(User.username == "admin")
        admin = session.exec(statement).first()
        
        if not admin:
            print("Creating Admin user...")
            admin_user = User(
                username="admin",
                email="admin@example.com",
                password_hash=get_password_hash("password123"),
                role="admin"
            )
            session.add(admin_user)
        else:
            print("Admin user already exists.")

        # Check if inspector exists
        statement = select(User).where(User.username == "inspector")
        inspector = session.exec(statement).first()
        
        if not inspector:
            print("Creating Inspector user...")
            inspector_user = User(
                username="inspector",
                email="inspector@example.com",
                password_hash=get_password_hash("password123"),
                role="inspector"
            )
            session.add(inspector_user)
        else:
            print("Inspector user already exists.")

        session.commit()
        print("Seeding complete!")

if __name__ == "__main__":
    seed_users()
