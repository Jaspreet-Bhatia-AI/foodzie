# Foodzie 🛒 — Smart Restaurant Finder & Nutrition Guide

> **Foodzie** is a modern full-stack web application built with React, Next.js, Express, and Supabase. It connects users with nearby restaurants while providing detailed nutritional information and personalized dietary guidance.

## ✨ Key Features

- **Smart Restaurant Discovery**: Find restaurants based on location, cuisine, ratings, and price range.
- **Real-time Recommendations**: Get instant suggestions as you type.
- **Nutritional Insights**: View detailed calorie, protein, carb, and fat information for menu items.
- **Dietary Support**: Filter by vegetarian, vegan, gluten-free, and other dietary preferences.
- **User Authentication**: Secure sign-up and login with JWT-based sessions.
- **Favorite Restaurants**: Save and revisit your favorite dining spots.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (18.x or higher)
- **npm** (or **yarn** / **pnpm**)
- **PostgreSQL** (for local development)
- **Supabase Account** (for cloud deployment)

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

Create a `.env.local` file in both `frontend` and `backend` directories based on the provided `.env.example` files.

**Backend (`backend/.env.local`):**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/foodzie"
JWT_SECRET="your-secret-key"
PORT=5000
```

**Frontend (`frontend/.env.local`):**
```bash
NEXT_PUBLIC_API_URL="http://localhost:5000"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### Database Setup

1.  **Apply database migrations:**
    ```bash
    cd backend
    npx prisma migrate dev --name init
    ```

2.  **Generate Prisma client:**
    ```bash
    npx prisma generate
    ```

## 💻 Development

Start both the frontend and backend servers concurrently:

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📂 Project Structure

```
foodzie/
├── frontend/      # React + Next.js application
│   ├── app/        # Pages and layouts
│   ├── components/ # Reusable UI components
│   └── lib/        # Utility functions
│
├── backend/       # Express + Prisma server
│   ├── controllers/ # Request handlers
│   ├── middleware/  # Auth and error handling
│   ├── routes/    # API route definitions
│   ├── services/  # Business logic
│   └── prisma/    # Database models
│
├── public/        # Static assets
├── .gitignore     # Git ignore rules
└── README.md      # Project documentation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
