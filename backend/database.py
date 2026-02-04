from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
import os
from dotenv import load_dotenv

load_dotenv()

# Default to SQLite for ease of setup if Postgres not provided, but intended for Postgres
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fire_safety.db")

# check_same_thread needed for SQLite only
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

def init_db():
    SQLModel.metadata.create_all(engine)
