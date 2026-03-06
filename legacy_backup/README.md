# Fire Extinguisher Management System

A professional, compliance-aligned (IS 2190:2024) application for managing fire extinguisher inspections.

## Technology Stack Justification

The following technology stack has been selected to ensure the system is **Fast**, **Robust**, and **Real-Time**, as per requirements.

### Backend: FastAPI (Python)
*   **Why Fast?** FastAPI is one of the fastest Python frameworks available, on par with Node.js and Go, due to its underlying Starlette (ASGI) architecture.
*   **Why Robust?** It uses Python type hints for validation, reducing bugs and ensuring data integrity automatically (Pydantic).
*   **Why Real-Time?** specific support for WebSockets allows for high-performance real-time dashboards suitable for the "Real-Time Engine".

### Database: PostgreSQL
*   **Why Robust?** An industrial-grade relational database known for data integrity, complex queries, and ACID compliance. It is the standard for critical management systems.

### Frontend: Next.js (React)
*   **Why Fast?** Offers Server-Side Rendering (SSR) and Static Site Generation (SSG) for instant page loads.
*   **Why Robust?** Built on React, it provides a stable component-based architecture perfect for complex forms and dashboards.

### Real-Time Engine: WebSockets
*   **Overview**: We will use secure WebSockets to push updates (e.g., "New Inspection Submitted") instantly to the Admin Dashboard without page reloads.

## Project Structure
*   `/backend` - API, Logic, Database Models (FastAPI)
*   `/frontend` - Admin Dashboard, PWA, Public View (Next.js)
