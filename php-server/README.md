# Foodzie PHP & MySQL Backend

This is the PHP + MySQL port of the Foodzie Express API backend. It replicates all the REST API endpoints and is designed for the hybrid deployment approach (using the Next.js React frontend).

---

## 📂 Project Structure

```
php-server/
├── config/
│   └── db.php           # PDO database connection manager
├── helpers/
│   ├── auth.php         # Token validation & authorization middleware
│   └── response.php     # Helper for JSON outputs & error handling
├── public/
│   └── index.php        # Router & entry gateway script
├── src/
│   └── Controllers/     # Endpoint handlers (Auth, Menu, Orders, etc.)
├── composer.json        # Dependency mappings (JWT, Dotenv, Razorpay)
├── .env.example         # Template config file
├── schema.sql           # MySQL Table definitions for phpMyAdmin
└── seed.sql             # SQL mock data entries
```

---

## 🚀 Local Development Setup

### 1. Install PHP Dependencies
Make sure you have [Composer](https://getcomposer.org/) installed:

```bash
composer install
# OR if you are using the local composer.phar executable:
php composer.phar install
```

### 2. Configure Database & Environment
1. Create a MySQL database (e.g., named `foodzie`) via **phpMyAdmin** or CLI.
2. Import `schema.sql` to generate the table structure.
3. Import `seed.sql` to load test universities, users, items, and categories.
4. Copy the environment file template:
   ```bash
   cp .env.example .env
   ```
5. Open `.env` and fill in your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=foodzie
   DB_USER=root
   DB_PASS=your_mysql_password
   ```

### 3. Start the PHP Server
Run the built-in PHP development server targeting the `public` gateway directory:

```bash
php -S localhost:5000 -t public/
```
The PHP backend is now live and listening for requests at **`http://localhost:5000`**.

---

## ⚡ WebSockets Disclaimer

Unlike Node.js (which natively supports long-lived WebSockets via Socket.io), PHP is stateless. The WebSocket hooks in the controllers (like `newOrder` notifications and `orderStatusUpdate` state tracking) are stubbed out as inline comments. 

If you require real-time updates:
1. **HTTP Polling (Simple)**: Adjust the frontend to fetch `/api/orders/customer` and `/api/orders/vendor` periodically.
2. **Pusher (Recommended)**: Register a free Pusher account, install the `pusher/pusher-php-server` dependency, and trigger event broadcasts from the `OrderController` during state changes.
