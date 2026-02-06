# Standard Operating Procedure (SOP): Client Deployment
**Project:** Fire Extinguisher Management App
**Strategy:** Single Tenant ("Clone & Conquer")

This document outlines the step-by-step process to deploy a new, white-labeled version of the application for a specific client (e.g., Tata Steel, Indian Oil).

---

## 🏗️ Phase 1: Preparation (One-Time Setup)

Before you start selling, ensure you have these "Master" accounts:

1.  **GitHub Account**: Holds the Source Code.
    *   *Status*: Done (Your current account).
2.  **Railway Account**: Hosts the Servers.
    *   *Status*: Done.
    *   *Payment Method*: Ensure a credit card is linked for auto-billing (~$5/client).
3.  **Domain Registrar Account**: To buy generic domains (e.g., Godaddy, Namecheap).

---

## 🚀 Phase 2: Deployment Steps for a New Client

**Scenario**: You just signed a deal with **"Acme Corp"**.

### Step 1: Create the Project in Railway
1.  Log in to [Railway.app](https://railway.app/).
2.  Click **"New Project"**.
3.  Select **"Deploy from GitHub repo"**.
4.  Choose your repository: `FireExtinguisher_Dev`.
5.  **Important**: Rename the project immediately to `FireApp-AcmeCorp` so you don't confuse it with others.

### Step 2: Configure The Database
1.  Inside the new project, right-click the empty space and select **"Database"** -> **"PostgreSQL"**.
2.  Wait for it to initialize (takes ~30 seconds).

### Step 3: Configure Environment Variables
1.  Click on the **"FireExtinguisher_Dev"** service (the main app).
2.  Go to the **"Variables"** tab.
3.  Add the following keys (Copy values from your Master Project or generating new ones):
    *   `DATABASE_URL`: *Railway fills this automatically (Reference variable).*
    *   `SECRET_KEY`: Generate a random string (e.g., `openssl rand -hex 32` or just smash your keyboard).
    *   `ALGORITHM`: `HS256`.
    *   `ACCESS_TOKEN_EXPIRE_MINUTES`: `300`.
    *   `NEXT_PUBLIC_API_URL`: Leave blank until Step 4 is done.

### Step 4: Domain Setup (The "Safe" Step) 🛡️
*Prevent IT blocks by using a custom domain.*

1.  Go to the **"Settings"** tab of the App Service in Railway.
2.  Scroll to **"Networking"**.
3.  **Option A (Free/Quick)**: Click "Generate Domain". You get `acme-corp.up.railway.app`.
    *   *Risk*: Some strict IT firewalls block `*.railway.app`.
4.  **Option B (Professional)**: Use a Custom Domain.
    *   Buy `siddhisafety.com` on GoDaddy.
    *   Create a subdomain `acme.siddhisafety.com`.
    *   In Railway, click "Custom Domain" -> enter `acme.siddhisafety.com`.
    *   In GoDaddy, add the `CNAME` record Railway provides.
5.  **Update Variable**: Copy this final URL (e.g., `https://acme.siddhisafety.com`) and paste it into the `NEXT_PUBLIC_API_URL` variable from Step 3.
6.  **Redeploy**: Click "Redeploy" to apply the URL change.

---

## 🎨 Phase 3: White-Labeling (Branding)

Make the app look like it belongs to Acme Corp.

1.  Go to the deployed URL (e.g., `https://acme.siddhisafety.com`).
2.  Log in as the default Admin (Create the first user via the `/docs` endpoint or using a script if you haven't built a signup page).
    *   *Tip*: Use your local `create_superuser.py` script pointed at the *new* database URL to create the initial admin.
3.  Go to **Admin Dashboard -> Profile**.
4.  **Company Name**: Change "Siddhi Industrial" to "Acme Corp Safety Div".
5.  **Logo**: Upload Acme Corp's logo.
6.  **Save**.

**Result**: The top navigation and reports now say "Acme Corp". The client feels special.

---

## 💰 Phase 4: Cost Analysis & Pricing

### Your Costs (The "COGS")
*   **Railway Server**: ~$5.00 / month (depends on usage).
*   **Domain**: ~$15.00 / year (fixed cost for your main domain).
*   **Total Monthly Cost per Client**: **~$5 - $7**.

### Pricing Strategy (Recommendation)
Don't sell it for a one-time fee. Sell complete peace of mind.

*   **Setup Fee**: ₹25,000 - ₹50,000 (One time).
    *   Covers: Configuring the server, uploading their logo, training them.
*   **Annual Subscription (SaaS)**: ₹15,000 - ₹30,000 / year.
    *   Covers: Server costs (₹6,000/yr), SSL certificates, bug fixes, data backups.
    *   *Pitch*: "For less than ₹100/day, you get a compliant, digital safety register."

---

## ✅ Checklist for Handover
- [ ] App is running on `https://client.siddhisafety.com`.
- [ ] Database is private and secure.
- [ ] Admin account created: `admin@acme.com` / `Password123!` (Force them to change it).
- [ ] Logo updated.
- [ ] "Pending Check" fixed and Charts working.
- [ ] Test QR Code scan works on their WiFi.

**You are now ready to sell.**
