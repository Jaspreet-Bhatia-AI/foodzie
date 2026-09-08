# Foodzie Frontend 🍔🚀

**Foodzie** is a comprehensive campus food-ordering platform designed to streamline the university dining experience. It connects students, canteen vendors, delivery personnel, and campus administrators into a single, cohesive real-time ecosystem.

---

## 📖 Overview

The Foodzie frontend is a modern, responsive, and dynamic web application built to handle various campus food delivery workflows. By leveraging real-time data, geospatial tracking, and an intuitive UI, Foodzie aims to minimize canteen queues, provide vendors with actionable analytics, and ensure students get their meals hot and on time.

The platform provides dedicated, specialized dashboards and flows for four distinct user roles:
- **Students (Customers):** Browse campus menus, customize orders, track live deliveries, and pay via QR codes/UPI.
- **Vendors (Canteens):** Manage digital menus in real-time, accept/reject incoming orders, view business analytics, and manage canteen employees.
- **Delivery Personnel (Riders):** Accept assigned deliveries, update statuses, navigate using live maps, and track cash-on-delivery (COD) deposits.
- **Administrators:** Oversee platform health, monitor cross-university analytics, manage user roles, and seamlessly toggle global platform branding.

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
- **Dynamic Multi-Currency Support:** Automatically adapts to the user's university location, formatting all monetary values correctly (e.g., `₹` for India, `$` for international).
- **Interactive Dashboards:** Built using `recharts` to provide vendors and admins with rich, visual data analytics, sales trends, and order distribution charts.
- **Robust State Management:** Utilizes `zustand` for lightweight, persistent client-side state management (like shopping carts and UI states).
- **QR Code Scanning:** Includes integrated `html5-qrcode` scanning for seamless delivery hand-offs and payments.
- **Dark Mode Support:** Fully integrated with `next-themes` and styled beautifully using Tailwind CSS for a premium aesthetic in any lighting.

---

## 🛠️ Technology Stack

This project is built using industry-standard, bleeding-edge web technologies:

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://lucide.dev/"><img src="https://img.shields.io/badge/Lucide_React-F87171?style=for-the-badge&logo=lucide&logoColor=white" alt="Lucide React" /></a>
  <a href="https://zustand-demo.pmnd.rs/"><img src="https://img.shields.io/badge/Zustand-000000?style=for-the-badge&logo=react&logoColor=white" alt="Zustand" /></a>
  <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101" alt="Socket.IO" /></a>
  <a href="https://leafletjs.com/"><img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" /></a>
  <a href="https://recharts.org/"><img src="https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=react&logoColor=white" alt="Recharts" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
</p>

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Library:** [React 18](https://react.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Real-Time Communication:** [Socket.IO Client](https://socket.io/)
- **Maps & Geolocation:** [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Database/Auth SDK:** [Supabase JS](https://supabase.com/)

---

## 🚀 Getting Started

Follow these instructions to set up the frontend locally.

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or newer recommended)
- **npm** or **yarn**

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment Variables:**
   Duplicate the `.env.example` file and rename it to `.env.local`. Fill in your API keys, backend URL, and Supabase credentials.
   ```bash
   cp .env.example .env.local
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```

4. **Access the Application:**
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the app running.

---

## 📁 Project Structure

```text
frontend/
├── app/                  # Next.js 14 App Router pages and layouts
│   ├── admin/            # Admin dashboard views
│   ├── delivery/         # Delivery personnel views
│   ├── shop/             # Customer-facing canteen menus
│   └── vendor/           # Canteen vendor dashboard views
├── components/           # Reusable UI components (Modals, Icons, Charts)
├── context/              # React Context providers (Brand, Currency)
├── lib/                  # Utilities, API configurations, and Zustand stores
├── public/               # Static assets (images, fonts, etc.)
└── package.json          # Project dependencies and scripts
```

---

*Designed & Built for the future of campus dining.*
