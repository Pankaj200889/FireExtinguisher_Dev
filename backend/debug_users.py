from sqlmodel import Session, select
from database import engine
from models import User

def list_users():
    with Session(engine) as session:
        statement = select(User)
        users = session.exec(statement).all()
        print(f"Total Users: {len(users)}")
        for user in users:
            print(f"User: {user.username}, Role: {user.role}, Hash: {user.password_hash[:10]}...")

if __name__ == "__main__":
    list_users()
