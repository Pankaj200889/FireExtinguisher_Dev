from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from database import get_session
from models import Extinguisher, Inspection
from datetime import datetime
import io
import csv

# Excel Support
import openpyxl
from openpyxl.styles import Font, Alignment

# PDF Support (ReportLab)
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/export/excel")
async def export_excel(session: Session = Depends(get_session)):
    """Export all Extinguisher data to Excel."""
    
    # query data
    extinguishers = session.exec(select(Extinguisher)).all()
    
    # Create Workbook
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Fire Extinguisher Register"
    
    # Headers (Annex H + Extras)
    headers = [
        "Sl No.", "Type", "Capacity", "Make", "Year of Mfg", "Location", 
        "Last Pressure Test", "Refilled On", "Due Date", "Status"
    ]
    
    # Style Header
    ws.append(headers)
    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")
        
    # Add Data
    for ext in extinguishers:
        # Get latest inspection details (mock logic for now, or fetch relation)
        last_inspection = None # logic to get latest
        
        ws.append([
            ext.sl_no, ext.type, ext.capacity, ext.make, ext.year_of_manufacture, ext.location,
            "-", "-", "-", "Active" # Placeholders until we join inspections
        ])
        
    # Save to buffer
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    filename = f"Fire_Extinguisher_Register_{datetime.now().strftime('%Y%m%d')}.xlsx"
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/pdf")
async def export_pdf(session: Session = Depends(get_session)):
    """Export Annex H Register as PDF."""
    
    extinguishers = session.exec(select(Extinguisher)).all()
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
    elements = []
    
    # Title
    styles = getSampleStyleSheet()
    title = Paragraph("Annex H - Register of Fire Extinguishers", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 20))
    
    # Table Data
    data = [["Sl No.", "Type", "Capacity", "Make", "Year", "Location", "Remarks"]]
    
    for ext in extinguishers:
        data.append([
            ext.sl_no,
            ext.type,
            ext.capacity,
            ext.make,
            str(ext.year_of_manufacture),
            ext.location,
            ""
        ])
        
    # Create Table
    t = Table(data, colWidths=[60, 80, 60, 100, 50, 150, 150])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(t)
    doc.build(elements)
    
    buffer.seek(0)
    filename = f"AnnexH_Register_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
