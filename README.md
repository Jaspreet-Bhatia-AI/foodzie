# Foodzie 🍔🚀 — Smart Campus Dining Platform

> **Foodzie** is a comprehensive campus food-ordering platform designed to streamline the university dining experience. It connects students, canteen vendors, delivery personnel, and campus administrators into a single, cohesive real-time ecosystem.

---

## 📖 Overview

The platform provides dedicated dashboards and flows for four distinct user roles:
- **Students (Customers):** Browse campus menus, customize orders, track live deliveries, and pay via QR codes/UPI.
- **Vendors (Canteens):** Manage digital menus in real-time, accept/reject incoming orders, view business analytics, and manage canteen employees.
- **Delivery Personnel (Riders):** Accept assigned deliveries, update statuses, navigate using live maps, and track COD deposits.
- **Administrators:** Oversee platform health, monitor cross-university analytics, manage user roles, and toggle global platform branding.

### 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Clients
        App[📱 Foodzie Web App]
    end

    subgraph Backend [Backend Server Node.js]
        API[Express REST API]
        WS[Socket.IO Server]
        Auth[JWT Authentication]
    end

    subgraph External [External Services]
        Payment[💳 Direct UPI Payments]
    end

    subgraph DataLayer [Data Layer]
        DB[(🐘 PostgreSQL via Prisma)]
        Cache[(⚡ Redis Cache)]
    end

    App <-->|HTTP Requests| API
    App <-->|Real-time Events| WS
    API --> Auth
    API <--> DB
    API <--> Cache
    WS <--> Cache
    API <--> Payment
```

### 🔄 Order Lifecycle Workflow

```mermaid
sequenceDiagram
    autonumber
    participant S as 👨‍🎓 Student
    participant F as 📱 Frontend (App)
    participant B as ⚙️ Backend (API)
    participant V as 🏪 Vendor
    participant R as 🛵 Rider

    S->>F: Browse Menu & Place Order
    F->>B: REST: POST /api/orders
    B-->>V: ⚡ Socket.io: New Order Alert
    V->>F: Accept Order & Start Prep
    F->>B: REST: UPDATE Status (Preparing)
    B-->>S: ⚡ Socket.io: Order Preparing
    V->>F: Mark Ready for Delivery
    B-->>R: ⚡ Socket.io: Delivery Request
    R->>F: Accept Delivery
    R-->>S: 📍 Live GPS Tracking (Leaflet)
    S->>R: Receive Food & Scan QR
    R->>F: Confirm Delivery Complete
    F->>B: REST: UPDATE Status (Completed)
```

---

## ✨ Key Features

- **Real-Time Order Tracking:** Integrated with `socket.io-client` and `react-leaflet` to provide live GPS tracking and instant order status updates.
- **Dynamic Multi-Currency Support:** Automatically adapts to the user's university location, formatting all monetary values correctly.
- **Interactive Dashboards:** Built using `recharts` to provide vendors and admins with visual data analytics and sales trends.
- **Robust Authentication:** Secure JWT-based authentication and role-based access control (Admin, Vendor, Student, Delivery).
- **Payment Processing:** Supports Direct UPI transactions (Student to Vendor) alongside Cash on Delivery (COD) workflows.
- **Smart Recommendations:** Powered by AI to send personalized, daily food recommendations based on popular items at the user's campus.

---

## 🛠️ Technology Stack

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" /></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" /></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101" alt="Socket.IO" /></a>
  <a href="https://redis.io/"><img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" /></a>
</p>

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Library:** React 18
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Maps:** Leaflet & React-Leaflet
- **Data Visualization:** Recharts

### Backend
- **Runtime & Framework:** Node.js, Express.js
- **Language:** TypeScript
- **ORM & Database:** Prisma, PostgreSQL
- **Real-Time & Cache:** Socket.IO, Redis

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (or yarn / pnpm)
- **PostgreSQL** & **Redis** (for local backend development)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Jaspreet-Bhatia-AI/foodzie.git
    cd foodzie
    ```

2.  **Install dependencies:**
    ```bash
    cd frontend && npm install
    cd ../backend && npm install
    ```

### Configuration

Create a `.env.local` (or `.env`) file in both `frontend` and `backend` directories based on the provided `.env.example` files.

**Backend (`backend/.env`):**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/foodzie"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
PORT=8000
```

**Frontend (`frontend/.env.local`):**
```bash
NEXT_PUBLIC_API_URL="http://localhost:8000"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### Database Setup

1.  **Generate Prisma client and apply migrations:**
    ```bash
    cd backend
    npx prisma generate
    npx prisma migrate dev
    ```

2.  **(Optional) Seed the Database:**
    ```bash
    npx prisma db seed
    ```

## 💻 Development

Start both the frontend and backend servers:

```bash
# Start backend (from the /backend directory)
npm run dev

# Start frontend (from the /frontend directory)
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

---

## 📂 Project Structure

```text
foodzie/
├── frontend/             # Next.js Application
│   ├── app/              # App Router pages and layouts
│   ├── components/       # Reusable UI components
│   ├── context/          # React Context providers
│   └── lib/              # Utilities and Zustand stores
│
├── backend/              # Express + Prisma Server
│   ├── prisma/           # Schema, migrations, and seeds
│   ├── src/
│   │   ├── controllers/  # Route logic and handlers
│   │   ├── routes/       # API route definitions
│   │   ├── middleware/   # JWT auth and rate limiting
│   │   └── lib/          # Utilities and configurations
│   └── .env.example      
│
├── .gitignore            # Root Git ignore rules
└── README.md             # Unified project documentation
```

---

*Powering the future of campus dining.*
