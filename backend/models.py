from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
import uuid

class UserBase(SQLModel):
    username: str = Field(index=True, unique=True)
    role: str = Field(default="inspector")  # 'admin', 'inspector'

class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    password_hash: str

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: uuid.UUID

class UserUpdate(SQLModel):
    password: Optional[str] = None
    role: Optional[str] = None

class Extinguisher(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    sl_no: str = Field(unique=True, index=True)
    type: str  # CO2, ABC, Water
    capacity: str
    location: str
    make: Optional[str] = None
    year_of_manufacture: Optional[int] = None
    qr_code_url: Optional[str] = None
    
    # Status tracking
    last_inspection_date: Optional[datetime] = None
    next_service_due: Optional[datetime] = None
    status: str = Field(default="Pending") # Operational, Non-Operational, Pending
    
    inspections: List["Inspection"] = Relationship(back_populates="extinguisher")

class Inspection(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    extinguisher_id: uuid.UUID = Field(foreign_key="extinguisher.id")
    inspector_id: Optional[uuid.UUID] = Field(default=None) # Link to User if authenticated
    
    inspection_type: str # Quarterly, Annual
    inspection_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Check details
    observation: Optional[str] = Field(default="Ok") # Ok, Not Ok, etc.
    remarks: Optional[str] = None
    pressure_tested_on: Optional[datetime] = None
    date_of_discharge: Optional[datetime] = None
    refilled_on: Optional[datetime] = None
    due_for_refilling: Optional[datetime] = None
    
    # Evidence
    photo_path: Optional[str] = None # Primary photo
    signature_path: Optional[str] = None
    
    # Audit
    device_id: Optional[str] = None
    
    extinguisher: Optional[Extinguisher] = Relationship(back_populates="inspections")

class CompanySettings(SQLModel, table=True):
    id: int = Field(default=1, primary_key=True)
    company_name: str = Field(default="Siddhi Industrial Solutions")
    logo_url: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
