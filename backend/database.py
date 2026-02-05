from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
import os

# Get DB URL from env or fallback to local SQLite
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = f"sqlite:///{os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fire_safety.db')}"

# Handle args based on DB type
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

def init_db():
    SQLModel.metadata.create_all(engine)
