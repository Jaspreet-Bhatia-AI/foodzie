<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Helpers\Response;
use App\Helpers\Auth;
use App\Controllers\AuthController;
use App\Controllers\CategoryController;
use App\Controllers\FoodItemController;
use App\Controllers\MenuController;
use App\Controllers\OrderController;
use App\Controllers\PaymentController;

// ─── 1. Load Environment Variables ───────────────────────────────────────────
if (file_exists(__DIR__ . '/../.env')) {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
}

// ─── 2. CORS Headers ──────────────────────────────────────────────────────────
$allowedOriginsStr = $_ENV['ALLOWED_ORIGINS'] ?? 'http://localhost:3000';
$allowedOrigins = array_map('trim', explode(',', $allowedOriginsStr));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000"); // Fallback
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Razorpay-Signature");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ─── 3. Request Context & Parser ──────────────────────────────────────────────
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Clean query string out of URI
$uriPath = parse_url($requestUri, PHP_URL_PATH);
$uriPath = rtrim($uriPath, '/');

// Get request body
$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true) ?? [];

// Helper functions for routes
function matchRoute(string $method, string $pathPattern, string $requestMethod, string $uriPath, &$matches = []): bool {
    if ($requestMethod !== $method) {
        return false;
    }
    // Convert e.g. /api/menu/:id to regex /api/menu/([^/]+)
    $pattern = '@^' . preg_replace('/:([^/]+)/', '([^/]+)', $pathPattern) . '$@';
    return preg_match($pattern, $uriPath, $matches) === 1;
}

// Extract headers
$headers = getallheaders();

try {
    // ─── 4. Routing Table ─────────────────────────────────────────────────────

    // ─── Public Menu Routes ───
    if (matchRoute('GET', '/api/menu/universities', $requestMethod, $uriPath)) {
        $controller = new MenuController();
        $controller->getUniversities($_GET);
        exit;
    }

    if (matchRoute('GET', '/api/menu/vendor/:vendorId', $requestMethod, $uriPath, $matches)) {
        $controller = new MenuController();
        $controller->getVendorMenu($matches[1]);
        exit;
    }

    if (matchRoute('GET', '/api/menu/:universityId', $requestMethod, $uriPath, $matches)) {
        $controller = new MenuController();
        $controller->getUniversityMenu($matches[1]);
        exit;
    }

    // ─── Authentication Routes ───
    if (matchRoute('POST', '/api/auth/register', $requestMethod, $uriPath)) {
        $controller = new AuthController();
        $controller->register($body);
        exit;
    }

    if (matchRoute('POST', '/api/auth/login', $requestMethod, $uriPath)) {
        $controller = new AuthController();
        $controller->login($body);
        exit;
    }

    if (matchRoute('GET', '/api/auth/me', $requestMethod, $uriPath)) {
        $user = Auth::authenticate();
        $controller = new AuthController();
        $controller->getMe($user);
        exit;
    }

    if (matchRoute('PATCH', '/api/auth/me', $requestMethod, $uriPath)) {
        $user = Auth::authenticate();
        $controller = new AuthController();
        $controller->updateMe($user, $body);
        exit;
    }

    // ─── Vendor Admin Category Routes ───
    if (matchRoute('GET', '/api/vendor/categories', $requestMethod, $uriPath)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Vendor');
        $controller = new CategoryController();
        $controller->getCategories($user);
        exit;
    }

    if (matchRoute('POST', '/api/vendor/categories', $requestMethod, $uriPath)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Vendor');
        $controller = new CategoryController();
        $controller->createCategory($user, $body);
        exit;
    }

    if (matchRoute('PATCH', '/api/vendor/categories/:id', $requestMethod, $uriPath, $matches)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Vendor');
        $controller = new CategoryController();
        $controller->updateCategory($user, $matches[1], $body);
        exit;
    }

    if (matchRoute('DELETE', '/api/vendor/categories/:id', $requestMethod, $uriPath, $matches)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Vendor');
        $controller = new CategoryController();
        $controller->deleteCategory($user, $matches[1]);
        exit;
    }

    // ─── Vendor Admin Food Item Routes ───
    if (matchRoute('GET', '/api/vendor/items', $requestMethod, $uriPath)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Vendor');
        $controller = new FoodItemController();
        $controller->getFoodItems($user);
        exit;
    }

    if (matchRoute('POST', '/api/vendor/items', $requestMethod, $uriPath)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Vendor');
        $controller = new FoodItemController();
        $controller->createFoodItem($user, $body);
        exit;
    }

    if (matchRoute('PATCH', '/api/vendor/items/:id', $requestMethod, $uriPath, $matches)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Vendor');
        $controller = new FoodItemController();
        $controller->updateFoodItem($user, $matches[1], $body);
        exit;
    }

    if (matchRoute('DELETE', '/api/vendor/items/:id', $requestMethod, $uriPath, $matches)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Vendor');
        $controller = new FoodItemController();
        $controller->deleteFoodItem($user, $matches[1]);
        exit;
    }

    // ─── Orders Routes ───
    if (matchRoute('POST', '/api/orders', $requestMethod, $uriPath)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Student');
        $controller = new OrderController();
        $controller->createOrder($user, $body);
        exit;
    }

    if (matchRoute('GET', '/api/orders/customer', $requestMethod, $uriPath)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Student');
        $controller = new OrderController();
        $controller->getCustomerOrders($user);
        exit;
    }

    if (matchRoute('GET', '/api/orders/vendor', $requestMethod, $uriPath)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Vendor');
        $controller = new OrderController();
        $controller->getVendorOrders($user);
        exit;
    }

    if (matchRoute('GET', '/api/orders/vendor/stats', $requestMethod, $uriPath)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Vendor');
        $controller = new OrderController();
        $controller->getVendorStats($user);
        exit;
    }

    if (matchRoute('GET', '/api/orders/vendor/analytics', $requestMethod, $uriPath)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Vendor');
        $controller = new OrderController();
        $controller->getVendorAnalytics($user);
        exit;
    }

    if (matchRoute('PATCH', '/api/orders/:id/status', $requestMethod, $uriPath, $matches)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Vendor');
        $controller = new OrderController();
        $controller->updateOrderStatus($user, $matches[1], $body);
        exit;
    }

    // ─── Payments Routes ───
    if (matchRoute('POST', '/api/payment/order', $requestMethod, $uriPath)) {
        $user = Auth::authenticate();
        Auth::requireRole($user, 'Student');
        $controller = new PaymentController();
        $controller->createPaymentOrder($user, $body);
        exit;
    }

    if (matchRoute('POST', '/api/payment/webhook', $requestMethod, $uriPath)) {
        $controller = new PaymentController();
        $controller->handleWebhook($headers, $rawBody, $body);
        exit;
    }

    // Route Not Found
    Response::error("Route not found", 404);

} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
