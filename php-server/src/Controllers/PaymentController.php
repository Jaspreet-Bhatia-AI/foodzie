<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use Razorpay\Api\Api;
use Exception;

class PaymentController {
    private \PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function createPaymentOrder(array $user, array $body): void {
        $foodzieOrderId = $body['foodzieOrderId'] ?? null;

        if (!$foodzieOrderId) {
            Response::error("foodzieOrderId is required", 400);
        }

        $stmt = $this->db->prepare("SELECT id, totalAmount, customerId FROM `Order` WHERE id = ?");
        $stmt->execute([$foodzieOrderId]);
        $order = $stmt->fetch();

        if (!$order) {
            Response::error("Order not found", 404);
        }

        if ($order['customerId'] !== $user['sub']) {
            Response::error("You do not own this order", 403);
        }

        $amountInPaise = intval(round(floatval($order['totalAmount']) * 100));

        $keyId = $_ENV['RAZORPAY_KEY_ID'] ?? '';
        $keySecret = $_ENV['RAZORPAY_KEY_SECRET'] ?? '';

        try {
            $api = new Api($keyId, $keySecret);
            $razorpayOrder = $api->order->create([
                'receipt'         => $foodzieOrderId,
                'amount'          => $amountInPaise,
                'currency'        => 'INR',
                'notes'           => [
                    'foodzieOrderId' => $foodzieOrderId
                ]
            ]);

            Response::json([
                "razorpayOrderId" => $razorpayOrder['id'],
                "amount" => $razorpayOrder['amount'],
                "currency" => $razorpayOrder['currency'],
                "receipt" => $razorpayOrder['receipt'],
                "foodzieOrderId" => $foodzieOrderId
            ], 201);
        } catch (Exception $e) {
            Response::error("Razorpay error: " . $e->getMessage(), 500);
        }
    }

    public function handleWebhook(array $headers, string $rawBody, array $body): void {
        $webhookSecret = $_ENV['RAZORPAY_WEBHOOK_SECRET'] ?? null;

        if (!$webhookSecret) {
            Response::error("Webhook secret not configured", 500);
        }

        $signature = $headers['x-razorpay-signature'] ?? $headers['X-Razorpay-Signature'] ?? null;
        if (!$signature) {
            Response::error("Missing signature header", 400);
        }

        $expectedSignature = hash_hmac('sha256', $rawBody, $webhookSecret);

        if ($signature !== $expectedSignature) {
            Response::error("Invalid webhook signature", 400);
        }

        $event = $body['event'] ?? '';
        if ($event === "payment.captured") {
            $notes = $body['payload']['payment']['entity']['notes'] ?? [];
            $foodzieOrderId = $notes['foodzieOrderId'] ?? null;

            if ($foodzieOrderId) {
                // Update database
                $update = $this->db->prepare("UPDATE `Order` SET paymentReceived = 1, status = 'Confirmed' WHERE id = ?");
                $update->execute([$foodzieOrderId]);

                // [WebSocket Placeholder] Emit newOrder event to vendor room
            }
        }

        Response::json(["received" => true]);
    }
}
