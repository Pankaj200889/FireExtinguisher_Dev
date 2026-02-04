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
    """Export Annex H Register as PDF (IS 2190 Compliance)."""
    
    extinguishers = session.exec(select(Extinguisher)).all()
    
    buffer = io.BytesIO()
    # Use Legal Landscape for more width
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), rightMargin=10, leftMargin=10, topMargin=10, bottomMargin=10)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = styles['Title']
    title_style.fontSize = 14
    title = Paragraph("ANNEX H - REGISTER OF FIRE EXTINGUISHER", title_style)
    subtitle = Paragraph("(Clauses 12 and 13)", styles['Normal'])
    subtitle.alignment = 1 # Center
    
    elements.append(title)
    elements.append(subtitle)
    elements.append(Spacer(1, 15))
    
    # Columns based on Image
    # 1. Sl No, 2. Type, 3. Capacity, 4. Year, 5. Make, 6. Location, 7. Quarterly Dates, 8. Annual Dates, 9. Pressure Test, 10. Discharge, 11. Refilled, 12. Due Refill, 13. Remarks
    headers = [
        "Sl No.", "Type", "Cap.", "Year", "Make", "Location", 
        "Quarterly\nInspection", "Annual\nInspection", "Pressure\nTested", "Date of\nDischarge", "Refilled\nOn", "Due for\nRefill", "Remarks"
    ]
    
    data = [headers]
    
    for ext in extinguishers:
        # Fetch Inspections
        inspections = session.exec(select(Inspection).where(Inspection.extinguisher_id == ext.id)).all()
        
        # Logic to find latest dates
        quarterly_dates = [i.inspection_date.strftime("%d-%m-%y") for i in inspections if i.inspection_type == "Quarterly"]
        annual_dates = [i.inspection_date.strftime("%d-%m-%y") for i in inspections if i.inspection_type == "Annual"]
        
        # Pressure Test (Find latest non-null)
        pressure_test = next((i.pressure_tested_on.strftime("%d-%m-%y") for i in sorted(inspections, key=lambda x: x.inspection_date, reverse=True) if i.pressure_tested_on), "-")
        
        # Last Refill
        refilled_on = next((i.refilled_on.strftime("%d-%m-%y") for i in sorted(inspections, key=lambda x: x.inspection_date, reverse=True) if i.refilled_on), "-")
        
        # Due Refill
        due_refill = next((i.due_for_refilling.strftime("%d-%m-%y") for i in sorted(inspections, key=lambda x: x.inspection_date, reverse=True) if i.due_for_refilling), "-")
        
        # Discharge
        discharge = next((i.date_of_discharge.strftime("%d-%m-%y") for i in sorted(inspections, key=lambda x: x.inspection_date, reverse=True) if i.date_of_discharge), "-")

        # Remarks (Concat latest?)
        remarks = next((i.remarks for i in sorted(inspections, key=lambda x: x.inspection_date, reverse=True) if i.remarks), "")

        data.append([
            Paragraph(ext.sl_no, styles['Normal']),
            Paragraph(ext.type, styles['Normal']),
            Paragraph(ext.capacity, styles['Normal']),
            str(ext.year_of_manufacture),
            Paragraph(ext.make, styles['Normal']),
            Paragraph(ext.location, styles['Normal']),
            Paragraph(", ".join(quarterly_dates[-4:]), styles['Normal']), # Show last 4
            Paragraph(", ".join(annual_dates[-2:]), styles['Normal']),    # Show last 2
            pressure_test,
            discharge,
            refilled_on,
            due_refill,
            Paragraph(remarks, styles['Normal'])
        ])
        
    # Column Widths (total ~770 for Letter Landscape)
    # Adjusted to fit 13 columns
    col_widths = [40, 50, 40, 35, 60, 80, 80, 80, 60, 60, 60, 60, 80]
    
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8), # Small font to fit
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('WORDWRAP', (0, 0), (-1, -1), True),
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
