from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Inspection, Extinguisher, User
from auth import get_current_user
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/inspections", tags=["inspections"])

class InspectionCreate(BaseModel):
    extinguisher_id: str
    inspection_type: str # Quarterly, Annual
    observation: Optional[str] = "Ok"
    remarks: Optional[str] = None
    pressure_tested_on: Optional[datetime] = None
    date_of_discharge: Optional[datetime] = None
    refilled_on: Optional[datetime] = None
    due_for_refilling: Optional[datetime] = None
    hydro_pressure_tested_on: Optional[datetime] = None
    next_hydro_pressure_test_due: Optional[datetime] = None
    next_service_due: Optional[datetime] = None
    photo_path: Optional[str] = None
    signature_path: Optional[str] = None
    image_urls: Optional[List[str]] = None # Just in case frontend sends it
    device_id: Optional[str] = None

@router.get("/stats")
def get_stats(session: Session = Depends(get_session)):
    """
    Get inspection counts for the last 7 days.
    """
    from sqlalchemy import func, cast, Date
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=6) # Last 7 days including today
    
    # SQLite/Postgres compatibility for date truncating can be tricky with plain SQLModel
    # For simplicity and DB agnostic behavior with small datasets:
    # Query all inspections in last 7 days and aggregate in Python.
    # (Optimized approach would use group_by in SQL if DB is strictly Postgres)
    
    statement = select(Inspection).where(Inspection.inspection_date >= start_date)
    recent_inspections = session.exec(statement).all()
    
    # Initialize dictionary for last 7 days
    stats = {}
    for i in range(7):
        day = (start_date + timedelta(days=i)).strftime("%a") # Mon, Tue
        # stats[day] = 0 # If we want strict days, but we want strict ordered list
    
    # Better structure: List of {name: "Mon", value: 0}
    days_map = []
    for i in range(7):
        d = start_date + timedelta(days=i)
        days_map.append({
            "date": d.date(), 
            "name": d.strftime("%a"), # Mon
            "value": 0
        })

    # Aggregate
    for insp in recent_inspections:
        # Use simple date comparison
        insp_date_str = insp.inspection_date.strftime("%Y-%m-%d")
        for day in days_map:
            # day["date"] is a date object
            if day["date"].strftime("%Y-%m-%d") == insp_date_str:
                day["value"] += 1
                break
                
    # Calculate Comparison (Previous 7 days)
    previous_start_date = start_date - timedelta(days=7)
    previous_period_statement = select(Inspection).where(
        Inspection.inspection_date >= previous_start_date,
        Inspection.inspection_date < start_date
    )
    previous_inspections = session.exec(previous_period_statement).all()
    
    current_total = len(recent_inspections)
    previous_total = len(previous_inspections)
    
    percentage_change = 0.0
    if previous_total > 0:
        percentage_change = ((current_total - previous_total) / previous_total) * 100
    elif current_total > 0:
        percentage_change = 100.0 # Infinite growth if previous was 0
        
    trend = "up" if percentage_change >= 0 else "down"

    # Return structured data
    return {
        "chart": [{"name": d["name"], "value": d["value"]} for d in days_map],
        "total": current_total,
        "change": round(percentage_change, 1),
        "trend": trend,
        "previous_total": previous_total
    }

@router.get("/export")
def export_history(session: Session = Depends(get_session)):
    """
    Export complete inspection history as CSV.
    """
    import csv
    from io import StringIO
    from fastapi.responses import StreamingResponse
    
    # Query all inspections with relations
    # Explicit join condition needed for User as FK might not be inferred due to optionality or missing relationship def
    statement = (
        select(Inspection, User, Extinguisher)
        .join(User, Inspection.inspector_id == User.id, isouter=True)
        .join(Extinguisher, Inspection.extinguisher_id == Extinguisher.id, isouter=True)
        .order_by(Inspection.inspection_date.desc())
    )
    results = session.exec(statement).all()
    
    # Create CSV in memory
    output = StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Timestamp (UTC)", "Inspector Name", "Inspector ID", "Device ID",
        "Action (Type)", "Extinguisher SN", "Location", "Result", "Remarks"
    ])
    
    for inspection, user, ext in results:
        writer.writerow([
            inspection.inspection_date.isoformat(),
            user.username if user else "Unknown",
            user.id if user else "N/A",
            inspection.device_id or "N/A",
            inspection.inspection_type,
            ext.sl_no if ext else "Deleted Asset",
            ext.location if ext else "N/A",
            inspection.observation or "N/A",
            inspection.remarks or ""
        ])
        
    output.seek(0)
    
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=audit_log_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return response

@router.get("/export-csv")
def export_inspections_csv(session: Session = Depends(get_session)):
    """
    Export complete inspection history as CSV, matching Annex H format.
    """
    import csv
    from io import StringIO
    from fastapi.responses import StreamingResponse
    from sqlalchemy.orm import selectinload
    
    # Query all active extinguishers with their inspections
    statement = (
        select(Extinguisher)
        .where(Extinguisher.is_active == True)
        .options(selectinload(Extinguisher.inspections))
        # .order_by(Extinguisher.sl_no) # Optional: sort by SL No
    )
    extinguishers = session.exec(statement).all()
    
    # Create CSV in memory
    output = StringIO()
    writer = csv.writer(output)
    
    # Headers to match "Main Safety Audit Report" (Annex H)
    writer.writerow([
        "SI No", "Type", "Capacity", "Year of Mfg", "Make", "Location", 
        "Monthly", "Quarterly", "Annual", 
        "Pressure Test", "Date of Discharge", "Refilled On", "Due for Refilling",
        "Hydro Test", "Next Hydro", "Status", "Remarks"
    ])
    
    for ext in extinguishers:
        # Sort inspections to easily find latest
        # inspections is a list on the model (selectinload)
        sorted_inspections = sorted(ext.inspections, key=lambda x: x.inspection_date, reverse=True)
        
        # Helper to find latest date for a specific type
        def get_latest_date(insp_type):
            for i in sorted_inspections:
                if i.inspection_type == insp_type:
                    return i.inspection_date.strftime("%d/%m/%Y")
            return "-"

        # Helper to format date if exists
        def fmt_date(d):
            return d.strftime("%d/%m/%Y") if d else "-"
            
        monthly_date = get_latest_date("Monthly")
        quarterly_date = get_latest_date("Quarterly")
        annual_date = get_latest_date("Annual")
        
        # Per models.py, 'refilled_on' and 'date_of_discharge' are on Inspection model, not Extinguisher model directly?
        # Let's check Extinguisher model again.
        # ExtinguisherBase: last_inspection_date, next_service_due, status, hydro_pressure_tested_on, next_hydro_pressure_test_due.
        # It DOES NOT have refilled_on or date_of_discharge directly. 
        # So we must get them from the latest relevant inspection.

        def get_latest_attr(attr_name):
             for i in sorted_inspections:
                 val = getattr(i, attr_name, None)
                 if val:
                     return val.strftime("%d/%m/%Y")
             return "-"

        writer.writerow([
            ext.sl_no,
            ext.type,
            ext.capacity,
            ext.year_of_manufacture or "-",
            ext.make or "-",
            ext.location,
            monthly_date,
            quarterly_date,
            annual_date,
            get_latest_attr("pressure_tested_on"), 
            get_latest_attr("date_of_discharge"),
            get_latest_attr("refilled_on"),
            get_latest_attr("due_for_refilling"), 
            fmt_date(ext.hydro_pressure_tested_on),
            fmt_date(ext.next_hydro_pressure_test_due),
            ext.status,
            sorted_inspections[0].remarks if sorted_inspections and sorted_inspections[0].remarks else "-"
        ])
        
    output.seek(0)
    
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    filename = f"Main_Safety_Audit_Report_{datetime.utcnow().strftime('%d%m%Y')}.csv"
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    return response

@router.post("/")
def create_inspection(
    inspection_data: InspectionCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    print(f"Received Inspection: {inspection_data}")
    
    ext_uuid = None
    try:
        from uuid import UUID
        ext_uuid = UUID(inspection_data.extinguisher_id)
    except ValueError:
        # Not a UUID, assume it is a Serial Number
        pass

    # 1. Validate Extinguisher
    if ext_uuid:
         extinguisher = session.get(Extinguisher, ext_uuid)
    else:
         # Try finding by SL No
         extinguisher = session.exec(select(Extinguisher).where(Extinguisher.sl_no == inspection_data.extinguisher_id)).first()

    if not extinguisher:
        print(f"Extinguisher not found for ID/SL: {inspection_data.extinguisher_id}")
        raise HTTPException(status_code=404, detail="Extinguisher not found")
    
    # Ensure we use the real UUID
    ext_uuid = extinguisher.id
        
    # 2. Create Inspection
    new_inspection = Inspection(
        extinguisher_id=ext_uuid, # Use the UUID object
        inspector_id=current_user.id,
        inspection_type=inspection_data.inspection_type,
        observation=inspection_data.observation,
        remarks=inspection_data.remarks,
        pressure_tested_on=inspection_data.pressure_tested_on,
        refilled_on=inspection_data.refilled_on,
        due_for_refilling=inspection_data.due_for_refilling,
        date_of_discharge=inspection_data.date_of_discharge,
        hydro_pressure_tested_on=inspection_data.hydro_pressure_tested_on,
        next_hydro_pressure_test_due=inspection_data.next_hydro_pressure_test_due,
        photo_path=inspection_data.photo_path,
        signature_path=inspection_data.signature_path,
        device_id=inspection_data.device_id
    )
    
    session.add(new_inspection)
    
    # 3. Update Extinguisher Status
    extinguisher.last_inspection_date = datetime.utcnow()
    
    if inspection_data.inspection_type == "Annual":
        extinguisher.next_service_due = datetime.utcnow() + timedelta(days=365)
    else:
        extinguisher.next_service_due = datetime.utcnow() + timedelta(days=90)
        
    extinguisher.status = "Operational" # Default to Operational on new inspection unless remarks suggest otherwise
    
    if inspection_data.hydro_pressure_tested_on:
        extinguisher.hydro_pressure_tested_on = inspection_data.hydro_pressure_tested_on
    if inspection_data.next_hydro_pressure_test_due:
        extinguisher.next_hydro_pressure_test_due = inspection_data.next_hydro_pressure_test_due
        
    session.add(extinguisher)
    session.commit()
    session.add(extinguisher)
    session.commit()
    session.refresh(new_inspection)
    
    return new_inspection

@router.get("/{id}")
def get_inspection(
    id: str,
    session: Session = Depends(get_session)
):
    try:
        from uuid import UUID
        insp_uuid = UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Inspection ID")
        
    inspection = session.get(Inspection, insp_uuid)
    if not inspection:
         raise HTTPException(status_code=404, detail="Inspection not found")
         
    return inspection

@router.get("/{id}/pdf")
def generate_inspection_pdf(
    id: str,
    session: Session = Depends(get_session)
):
    try:
        from uuid import UUID
        insp_uuid = UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Inspection ID")
        
    inspection = session.get(Inspection, insp_uuid)
    if not inspection:
         raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Load relations
    extinguisher = session.get(Extinguisher, inspection.extinguisher_id)
    inspector = session.get(User, inspection.inspector_id) if inspection.inspector_id else None
    
    # PDF Generation
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as ReportLabImage
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from io import BytesIO
    import requests
    from reportlab.lib.utils import ImageReader
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    story.append(Paragraph("Fire Extinguisher Inspection Report", styles['Title']))
    story.append(Spacer(1, 12))
    
    # Meta Info
    meta_data = [
        ["Inspection ID", str(inspection.id)],
        ["Date", inspection.inspection_date.strftime("%d-%b-%Y %H:%M")],
        ["Inspector", inspector.username if inspector else "Unknown"],
        ["Type", inspection.inspection_type],
        ["Status", inspection.observation],
    ]
    meta_table = Table(meta_data, colWidths=[150, 300])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))
    
    # Extinguisher Details
    story.append(Paragraph("Extinguisher Details", styles['Heading2']))
    if extinguisher:
        ext_data = [
            ["Serial No", extinguisher.sl_no],
            ["Type", extinguisher.type],
            ["Capacity", extinguisher.capacity],
            ["Location", extinguisher.location],
            ["Make", extinguisher.make or "-"],
            ["Mfg Year", str(extinguisher.year_of_manufacture) or "-"],
        ]
        ext_table = Table(ext_data, colWidths=[150, 300])
        ext_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 1, colors.black),
        ]))
        story.append(ext_table)
    else:
        story.append(Paragraph("Extinguisher details not found (deleted?)", styles['Normal']))
        
    story.append(Spacer(1, 12))
    
    # Inspection Checklist
    story.append(Paragraph("Checklist & Observations", styles['Heading2']))
    
    obs_data = [
         ["Observation", inspection.observation],
         ["Remarks", inspection.remarks or "-"],
         ["Pressure Tested On", inspection.pressure_tested_on.strftime("%d-%b-%Y") if inspection.pressure_tested_on else "-"],
         ["Hydro Test Due", inspection.next_hydro_pressure_test_due.strftime("%d-%b-%Y") if inspection.next_hydro_pressure_test_due else "-"],
         ["Refilled On", inspection.refilled_on.strftime("%d-%b-%Y") if inspection.refilled_on else "-"],
    ]
    
    obs_table = Table(obs_data, colWidths=[150, 300])
    obs_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.black),
    ]))
    story.append(obs_table)
    story.append(Spacer(1, 12))
    
    # Images
    story.append(Paragraph("Inspection Photo", styles['Heading2']))
    
    def fetch_image(url):
        try:
            res = requests.get(url, stream=True)
            if res.status_code == 200:
                img = BytesIO(res.content)
                return ReportLabImage(img, width=300, height=300, kind='proportional') # Maintain aspect ratio
        except Exception as e:
            print(f"Error fetching image: {e}")
            return None
            
    if inspection.photo_path:
        # Check if it's a URL (Cloudinary)
        if inspection.photo_path.startswith("http"):
             img_flowable = fetch_image(inspection.photo_path)
             if img_flowable:
                 story.append(img_flowable)
             else:
                 story.append(Paragraph("Error loading image from URL.", styles['Normal']))
        else:
             story.append(Paragraph(f"Image stored locally: {inspection.photo_path} (Cannot embed in this environment)", styles['Normal']))
    else:
        story.append(Paragraph("No photo available.", styles['Normal']))

    story.append(Spacer(1, 12))
    
    # Signature
    if inspection.signature_path:
        story.append(Paragraph("Signature", styles['Heading2']))
        if inspection.signature_path.startswith("http"):
             sig_flowable = fetch_image(inspection.signature_path)
             if sig_flowable:
                 story.append(sig_flowable)
    
    doc.build(story)
    buffer.seek(0)
    
    from fastapi.responses import StreamingResponse
    filename = f"Inspection_{inspection.id}.pdf"
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
