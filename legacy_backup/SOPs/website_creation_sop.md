# Standard Operating Procedure (SOP): Building a Website from Scratch
**Objective:** Define the roadmap for building professional websites for clients.

This guide provides a structured approach to website development, from initial concept to final delivery, including cost analysis.

---

## 🗺️ Phase 1: Planning & Strategy (The "Blueprint")

Before writing a single line of code, define what you are building.

1.  **Define the Goal**:
    *   *Brochure Site*: Showcases information (e.g., Law Firm, Restaurant). -> **Static Site**.
    *   *Web App*: Interactive functionality (e.g., this Fire Extinguisher App, E-commerce). -> **Dynamic App**.
2.  **Sitemap**: Draw a tree structure of pages (Home, About, Services, Contact).
3.  **Content Collection**: Ask the client for Logic, Text, and Photos *before* you start.

---

## 🛠️ Phase 2: Technology Selection (The "Tools")

Choose the right tool for the job to save time and money.

### Option A: The "Code" Route (Recommended for Premium/Custom Apps)
*   **Tech Stack**: Next.js (React), Tailwind CSS.
*   **Pros**: Infinite flexibility, high performance, you own the IP.
*   **Cons**: Higher learning curve, takes longer.
*   **Cost**: Low (Hosting is often free).

### Option B: The "No-Code" Route (Recommended for Fast/Cheap Brochure Sites)
*   **Tools**: WordPress, Framer, Webflow.
*   **Pros**: Drag-and-drop, extremely fast to build (1-2 days).
*   **Cons**: Monthly subscription costs, dependent on their platform.
*   **Cost**: Medium ($15-$30/month).

*Note: The rest of this SOP focuses on **Option A** (Coding), as that is your expertise.*

---

## 🏗️ Phase 3: Development Workflow

### Step 1: Visual Design (Figma) - *Optional but Professional*
*   Design the layout in Figma first to get client approval on "Look & Feel".
*   *Why?* It's faster to move pixels in Figma than to rewrite code.

### Step 2: Setup (The Foundation)
1.  Initialize Project: `npx create-next-app@latest my-client-site`.
2.  Install Essentials: `npm install lucide-react framer-motion`.
3.  Clean Up: Remove default `page.tsx` boilerplate.

### Step 3: Component Construction
Build reusable blocks like legos:
*   `Navbar.tsx`
*   `Footer.tsx`
*   `HeroSection.tsx`
*   `ContactForm.tsx`

### Step 4: Assembly
Assemble the components into pages (`src/app/page.tsx`, `src/app/about/page.tsx`).

---

## 🚀 Phase 4: Hosting & Deployment

For websites (Front-end heavy), use **Vercel** or **Netlify**. They are faster and cheaper than generic cloud servers for static content.

1.  **Push to GitHub**.
2.  **Connect to Vercel**:
    *   Go to Vercel.com -> "Add New Project" -> Import GitHub Repo.
    *   Click "Deploy".
    *   *Magic*: It deploys automatically every time you push code.
3.  **Domain**:
    *   Buy domain on GoDaddy.
    *   In Vercel Settings -> Domains -> Add `client-website.com`.
    *   Add the generic DNS records Vercel gives you to GoDaddy.

---

## 💰 Phase 5: Cost & Pricing Guide

### Base Costs (Your Expense)
1.  **Domain**: ₹1,000 / year.
2.  **Hosting (Vercel)**: ₹0 (Free Tier is generous) or $20/mo (Pro Team).
3.  **Database (if needed)**: ₹0 - ₹500/mo.
4.  **Total**: **~₹1,500 / year** (Extremely high margin).

### Pricing Your Services (The "Sell")
Don't charge for "Time". Charge for **Value**.

**Tier 1: The "Business Card" Site**
*   *Scope*: 1-3 Pages, Contact Form, Mobile Responsive.
*   *Timeline*: 3-5 Days.
*   *Price*: **₹15,000 - ₹25,000**.

**Tier 2: The "Professional" Site**
*   *Scope*: 5-8 Pages, Animations, CMS (Blog), SEO Optimized.
*   *Timeline*: 2 Weeks.
*   *Price*: **₹40,000 - ₹75,000**.

**Tier 3: The "Platform" (Web App)**
*   *Scope*: Login System, Database, Dashboards (Like Fire App).
*   *Timeline*: 4-8 Weeks.
*   *Price*: **₹1,50,000+**.

---

## ✅ Final Delivery Checklist
- [ ] Mobile Responsiveness Checked (Test on iPhone/Android).
- [ ] SEO Meta Tags (Title, Description) added.
- [ ] Contact Form actually sends emails (Test it!).
- [ ] Favicon (Tab Icon) added.
- [ ] 404 Page (Custom Error Page) added.
- [ ] Analytics (Google Analytics) script added.
