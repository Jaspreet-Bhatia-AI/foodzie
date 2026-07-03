<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use Razorpay\Api\Api;
use Exception;

class OrderController {
    private \PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    private function generateUuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    public function createOrder(array $user, array $body): void {
        $customerId = $user['sub'];
        $vendorId = $body['vendorId'] ?? null;
        $items = $body['items'] ?? null;
        $totalAmount = $body['totalAmount'] ?? null;
        $deliveryAddress = $body['deliveryAddress'] ?? 'Not Provided';
        $isCOD = isset($body['isCOD']) ? boolval($body['isCOD']) : false;

        if (!$vendorId || !$items || !is_array($items) || count($items) === 0 || $totalAmount === null) {
            Response::error("Missing required fields", 400);
        }

        $validatedTotalAmount = floatval($totalAmount);

        // --- 🛡️ GHOST ITEM SAFEGUARD ---
        $foodItemIds = array_map(function($item) {
            return $item['foodItemId'];
        }, $items);

        $placeholders = implode(',', array_fill(0, count($foodItemIds), '?'));
        $existingItemsQuery = "
            SELECT f.id 
            FROM FoodItem f 
            JOIN Category c ON f.categoryId = c.id 
            WHERE f.id IN ($placeholders) AND c.vendorId = ?
        ";
        $existingItemsStmt = $this->db->prepare($existingItemsQuery);
        $params = array_merge($foodItemIds, [$vendorId]);
        $existingItemsStmt->execute($params);
        $existingItems = $existingItemsStmt->fetchAll();

        if (count($existingItems) !== count($foodItemIds)) {
            Response::error("One or more items in your cart are no longer available. Please clear your cart.", 400);
        }
        // --- END SAFEGUARD ---

        $orderId = $this->generateUuid();

        try {
            $this->db->beginTransaction();

            $insertOrder = $this->db->prepare("
                INSERT INTO `Order` (id, customerId, vendorId, totalAmount, deliveryAddress, isCOD, status, paymentReceived) 
                VALUES (?, ?, ?, ?, ?, ?, 'Pending', 0)
            ");
            $insertOrder->execute([$orderId, $customerId, $vendorId, $validatedTotalAmount, $deliveryAddress, $isCOD ? 1 : 0]);

            $insertItem = $this->db->prepare("
                INSERT INTO OrderItem (id, orderId, foodItemId, quantity, priceAtTime) 
                VALUES (?, ?, ?, ?, ?)
            ");

            foreach ($items as $item) {
                $itemId = $this->generateUuid();
                $qty = intval($item['quantity'] ?? 1);
                $price = floatval($item['priceAtTime'] ?? 0);
                $insertItem->execute([$itemId, $orderId, $item['foodItemId'], $qty, $price]);
            }

            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error("Transaction failed: " . $e->getMessage(), 500);
        }

        // If Cash on Delivery, complete immediately
        if ($isCOD) {
            // [WebSocket Placeholder] Emit order updates to vendor channel/room
            Response::json([
                "success" => true,
                "message" => "Order created successfully",
                "foodzieOrderId" => $orderId
            ], 201);
            return;
        }

        // Generate Razorpay Order
        $keyId = $_ENV['RAZORPAY_KEY_ID'] ?? '';
        $keySecret = $_ENV['RAZORPAY_KEY_SECRET'] ?? '';
        $amountInPaise = intval(round($validatedTotalAmount * 100));

        if ($amountInPaise <= 0) {
            Response::error("Amount must be greater than 0", 400);
        }

        try {
            $api = new Api($keyId, $keySecret);
            $razorpayOrder = $api->order->create([
                'receipt'         => $orderId,
                'amount'          => $amountInPaise,
                'currency'        => 'INR',
                'notes'           => [
                    'foodzieOrderId' => $orderId
                ]
            ]);

            Response::json([
                "success" => true,
                "message" => "Order initiated successfully",
                "foodzieOrderId" => $orderId,
                "razorpayOrderId" => $razorpayOrder['id'],
                "amount" => $razorpayOrder['amount'],
                "currency" => $razorpayOrder['currency']
            ], 201);
        } catch (Exception $e) {
            Response::error("Razorpay Order Generation Failed: " . $e->getMessage(), 500);
        }
    }

    public function getVendorOrders(array $user): void {
        $vendorId = $user['sub'];

        $stmt = $this->db->prepare("
            SELECT o.*, u.name as customerName, u.email as customerEmail 
            FROM `Order` o 
            JOIN User u ON o.customerId = u.id 
            WHERE o.vendorId = ? 
            ORDER BY o.createdAt DESC
        ");
        $stmt->execute([$vendorId]);
        $orders = $stmt->fetchAll();

        foreach ($orders as &$order) {
            $order['totalAmount'] = floatval($order['totalAmount']);
            $order['isCOD'] = boolval($order['isCOD']);
            $order['paymentReceived'] = boolval($order['paymentReceived']);
            $order['customer'] = [
                "name" => $order['customerName'],
                "email" => $order['customerEmail']
            ];
            unset($order['customerName']);
            unset($order['customerEmail']);

            // Get items
            $itemStmt = $this->db->prepare("
                SELECT oi.*, fi.name as itemName, fi.imageUrl as itemImage
                FROM OrderItem oi
                JOIN FoodItem fi ON oi.foodItemId = fi.id
                WHERE oi.orderId = ?
            ");
            $itemStmt->execute([$order['id']]);
            $items = $itemStmt->fetchAll();

            foreach ($items as &$item) {
                $item['priceAtTime'] = floatval($item['priceAtTime']);
                $item['quantity'] = intval($item['quantity']);
                $item['foodItem'] = [
                    "name" => $item['itemName'],
                    "imageUrl" => $item['itemImage']
                ];
                unset($item['itemName']);
                unset($item['itemImage']);
            }
            $order['items'] = $items;
        }

        Response::json($orders);
    }

    public function updateOrderStatus(array $user, string $id, array $body): void {
        $vendorId = $user['sub'];
        $status = $body['status'] ?? null;

        if (!$status) {
            Response::error("status is required", 400);
        }

        $stmt = $this->db->prepare("SELECT * FROM `Order` WHERE id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch();

        if (!$order) {
            Response::error("Order not found", 404);
        }
        if ($order['vendorId'] !== $vendorId) {
            Response::error("Unauthorized", 403);
        }

        $update = $this->db->prepare("UPDATE `Order` SET status = ? WHERE id = ?");
        $update->execute([$status, $id]);

        // Get updated details with vendor name
        $stmt = $this->db->prepare("
            SELECT o.*, v.name as vendorName 
            FROM `Order` o 
            JOIN User v ON o.vendorId = v.id 
            WHERE o.id = ?
        ");
        $stmt->execute([$id]);
        $updatedOrder = $stmt->fetch();

        $updatedOrder['totalAmount'] = floatval($updatedOrder['totalAmount']);
        $updatedOrder['isCOD'] = boolval($updatedOrder['isCOD']);
        $updatedOrder['paymentReceived'] = boolval($updatedOrder['paymentReceived']);
        $updatedOrder['vendor'] = [
            "vendorName" => $updatedOrder['vendorName']
        ];
        unset($updatedOrder['vendorName']);

        // [WebSocket Placeholder] Emit orderStatusUpdate event for real-time tracking

        Response::json($updatedOrder);
    }

    public function getCustomerOrders(array $user): void {
        $customerId = $user['sub'];

        $stmt = $this->db->prepare("
            SELECT o.*, v.name as vendorName 
            FROM `Order` o 
            JOIN User v ON o.vendorId = v.id 
            WHERE o.customerId = ? 
            ORDER BY o.createdAt DESC
        ");
        $stmt->execute([$customerId]);
        $orders = $stmt->fetchAll();

        $formattedOrders = [];
        foreach ($orders as $order) {
            $itemStmt = $this->db->prepare("
                SELECT oi.*, fi.name as itemName, fi.imageUrl as itemImage
                FROM OrderItem oi
                JOIN FoodItem fi ON oi.foodItemId = fi.id
                WHERE oi.orderId = ?
            ");
            $itemStmt->execute([$order['id']]);
            $items = $itemStmt->fetchAll();

            foreach ($items as &$item) {
                $item['priceAtTime'] = floatval($item['priceAtTime']);
                $item['quantity'] = intval($item['quantity']);
                $item['foodItem'] = [
                    "name" => $item['itemName'],
                    "imageUrl" => $item['itemImage']
                ];
                unset($item['itemName']);
                unset($item['itemImage']);
            }

            $formattedOrders[] = [
                "id" => $order['id'],
                "customerId" => $order['customerId'],
                "vendorId" => $order['vendorId'],
                "deliveryPersonId" => $order['deliveryPersonId'],
                "totalAmount" => floatval($order['totalAmount']),
                "status" => $order['status'],
                "deliveryAddress" => $order['deliveryAddress'],
                "isCOD" => boolval($order['isCOD']),
                "paymentReceived" => boolval($order['paymentReceived']),
                "createdAt" => $order['createdAt'],
                "updatedAt" => $order['updatedAt'],
                "vendor" => [
                    "vendorName" => $order['vendorName']
                ],
                "items" => $items
            ];
        }

        Response::json($formattedOrders);
    }

    public function getVendorStats(array $user): void {
        $vendorId = $user['sub'];

        $stmt = $this->db->prepare("
            SELECT SUM(totalAmount) as totalRevenue, COUNT(id) as totalOrders 
            FROM `Order` 
            WHERE vendorId = ? AND status = 'Delivered'
        ");
        $stmt->execute([$vendorId]);
        $stats = $stmt->fetch();

        Response::json([
            "totalRevenue" => floatval($stats['totalRevenue'] ?? 0),
            "totalOrders" => intval($stats['totalOrders'] ?? 0)
        ]);
    }

    public function getVendorAnalytics(array $user): void {
        $vendorId = $user['sub'];

        // 1. Last 7 Days of Sales
        $last7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $dayName = date('D', strtotime("-$i days"));

            $salesStmt = $this->db->prepare("
                SELECT SUM(totalAmount) as revenue, COUNT(id) as orders 
                FROM `Order` 
                WHERE vendorId = ? AND status = 'Delivered' AND DATE(createdAt) = ?
            ");
            $salesStmt->execute([$vendorId, $date]);
            $sales = $salesStmt->fetch();

            $last7Days[] = [
                "date" => $dayName,
                "revenue" => floatval($sales['revenue'] ?? 0),
                "orders" => intval($sales['orders'] ?? 0)
            ];
        }

        // 2. Top 5 Selling Items
        $topItemsStmt = $this->db->prepare("
            SELECT oi.foodItemId, SUM(oi.quantity) as quantity, fi.name 
            FROM OrderItem oi
            JOIN `Order` o ON oi.orderId = o.id
            JOIN FoodItem fi ON oi.foodItemId = fi.id
            WHERE o.vendorId = ? AND o.status = 'Delivered'
            GROUP BY oi.foodItemId
            ORDER BY quantity DESC
            LIMIT 5
        ");
        $topItemsStmt->execute([$vendorId]);
        $topItemsRaw = $topItemsStmt->fetchAll();

        $topItems = [];
        foreach ($topItemsRaw as $item) {
            $topItems[] = [
                "name" => $item['name'] ?? 'Unknown',
                "quantity" => intval($item['quantity'])
            ];
        }

        // 3. Status Breakdown
        $breakdownStmt = $this->db->prepare("
            SELECT status, COUNT(id) as count 
            FROM `Order` 
            WHERE vendorId = ? 
            GROUP BY status
        ");
        $breakdownStmt->execute([$vendorId]);
        $statusBreakdownRaw = $breakdownStmt->fetchAll();

        $statusBreakdown = [];
        foreach ($statusBreakdownRaw as $s) {
            $statusBreakdown[] = [
                "status" => $s['status'],
                "count" => intval($s['count'])
            ];
        }

        Response::json([
            "last7Days" => $last7Days,
            "topItems" => $topItems,
            "statusBreakdown" => $statusBreakdown
        ]);
    }
}
