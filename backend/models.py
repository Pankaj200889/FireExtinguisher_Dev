from typing import Optional
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime, date
import uuid

class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    role: str = Field(default="inspector")  # 'admin', 'inspector', 'auditor'
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Extinguisher(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    sl_no: str = Field(unique=True, index=True) # Annex H: Sl No.
    type: str # CO2, ABC, Water, etc.
    capacity: str # 2kg, 4kg, 9L
    year_of_manufacture: int
    make: str
    location: str
    qr_code_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    inspections: list["Inspection"] = Relationship(back_populates="extinguisher")

class Inspection(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    extinguisher_id: uuid.UUID = Field(foreign_key="extinguisher.id")
    inspector_id: uuid.UUID = Field(foreign_key="user.id")
    
    inspection_type: str = Field(default="Quarterly") # Quarterly / Annual
    
    # Annex H Fields
    inspection_date: datetime = Field(default_factory=datetime.utcnow)
    pressure_tested_on: Optional[date] = None
    date_of_discharge: Optional[date] = None
    refilled_on: Optional[date] = None
    due_for_refilling: Optional[date] = None
    remarks: str
    
    # Evidence
    signature_path: str
    photo_path: Optional[str] = None
    
    extinguisher: Optional[Extinguisher] = Relationship(back_populates="inspections")
    images: list["InspectionImage"] = Relationship(back_populates="inspection")

class InspectionImage(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    inspection_id: uuid.UUID = Field(foreign_key="inspection.id")
    image_url: str
    caption: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    inspection: Optional[Inspection] = Relationship(back_populates="images")

class AuditLog(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    action: str
    details: Optional[str] = None # JSON string
    ip_address: Optional[str] = None
    device_info: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

