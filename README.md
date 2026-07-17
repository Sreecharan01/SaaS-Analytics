<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=250&section=header&text=SaaS%20Analytics%20Dashboard&fontSize=50&fontAlignY=35&desc=Production-Grade%20MERN%20Application&descAlignY=55" alt="Header" />
  
  <br />

  [![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&color=2563EB&center=true&vCenter=true&width=500&lines=Multi-Tenant+Architecture;Real-time+Visual+Analytics;Isolated+Business+Insights;Built+with+MERN+Stack)](https://git.io/typing-svg)

  <br />

  <p>
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  </p>

  <p><strong>Empower local businesses with enterprise-grade analytics, without the enterprise price tag.</strong></p>
</div>

---

## 🌟 Overview

A high-performance, multi-tenant analytics dashboard built for modern micro-SaaS businesses. Business owners can seamlessly sign up, import historical sales data via CSV, and unlock powerful visual insights. Everything from revenue trends and profit margins to product velocity and low-stock alerts is securely isolated per tenant using scoped compound indexes.

<!-- 
  💡 PRO TIP: Add a GIF of your dashboard in action here!
  <img src="./assets/demo.gif" width="100%" alt="Dashboard Demo" /> 
-->

---

## 🏗️ Architecture

```mermaid
graph TD
    Client("💻 Client Tier<br/>(React.js + Tailwind CSS)")
    Backend("⚙️ Business Tier<br/>(Express.js + Node.js)")
    DB[("🗄️ Database Tier<br/>(MongoDB Atlas)")]

    Client -- "Secure API Requests<br/>(Bearer JWT)" --> Backend
    Backend -- "Scoped Queries<br/>Model.find({ businessId })" --> DB
    
    style Client fill:#20232a,stroke:#61dafb,stroke-width:2px,color:#fff
    style Backend fill:#43853d,stroke:#fff,stroke-width:2px,color:#fff
    style DB fill:#4ea94b,stroke:#fff,stroke-width:2px,color:#fff
```

---

## ✨ Features

- 🔐 **Multi-Tenant Isolation**: Rock-solid security where every query is strictly scoped by `businessId` via JWT.
- 📈 **KPI Dashboard**: Real-time tracking of Revenue, Profit, Average Ticket Value, and Low Stock Alerts.
- 🎨 **Interactive Charts**: Beautiful visualizations including Area (revenue), Bar (top products), and Donut (payment split) charts.
- 📦 **Product Management**: Complete CRUD operations combined with lightning-fast CSV bulk imports.
- 🛒 **Sales Recording**: Multi-item transaction logging with automatic inventory decrementing.
- 🧠 **MongoDB Aggregations**: Complex analytical computations handled entirely server-side for maximum client performance.
- 📄 **PDF Reports**: Instant generation of downloadable financial ledgers.
- 📧 **Automated Alerts**: Low stock email notifications powered by Nodemailer.
- 📱 **Responsive Design**: Flawless mobile-first experience wrapped in a stunning glassmorphism dark theme.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB instance)

### 1️⃣ Backend Setup
```bash
cd server
npm install
# Edit .env with your configuration
npm run dev
```

### 2️⃣ Frontend Setup
```bash
cd client
npm install
npm run dev
```

> **Note**: The application will be accessible at `http://localhost:5173`.

---

## 📁 Sample Data

Jumpstart your testing by importing our curated sample datasets located in the `samples/` directory:
- 🛒 **`sample_products.csv`** — 15 sample products to populate your inventory.
- 💰 **`sample_sales.csv`** — 30 historical transactions to instantly generate analytics.

---

## 🔧 Environment Variables

Create a `.env` file in the `server` directory using the following template:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=30d
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
```

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer" width="100%" alt="Footer" />
  <p>Released under the <a href="./LICENSE">MIT License</a>.</p>
</div>
