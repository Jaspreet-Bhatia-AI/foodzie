<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;

class FoodItemController {
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

    public function getFoodItems(array $user): void {
        $vendorId = $user['sub'];

        $stmt = $this->db->prepare("
            SELECT f.*, c.name as categoryName 
            FROM FoodItem f 
            JOIN Category c ON f.categoryId = c.id 
            WHERE c.vendorId = ? 
            ORDER BY f.name ASC
        ");
        $stmt->execute([$vendorId]);
        $items = $stmt->fetchAll();

        foreach ($items as &$item) {
            $item['price'] = floatval($item['price']);
            $item['prepTimeMins'] = intval($item['prepTimeMins']);
            $item['isCooked'] = boolval($item['isCooked']);
            $item['stock'] = $item['stock'] !== null ? intval($item['stock']) : null;
            $item['isVegetarian'] = boolval($item['isVegetarian']);
            $item['discountPercent'] = $item['discountPercent'] !== null ? floatval($item['discountPercent']) : null;
            $item['category'] = [
                "id" => $item['categoryId'],
                "name" => $item['categoryName']
            ];
            unset($item['categoryName']);
        }

        Response::json(["items" => $items]);
    }

    public function createFoodItem(array $user, array $body): void {
        $vendorId = $user['sub'];
        $name = $body['name'] ?? null;
        $description = $body['description'] ?? null;
        $price = isset($body['price']) ? floatval($body['price']) : null;
        $imageUrl = $body['imageUrl'] ?? null;
        $prepTimeMins = isset($body['prepTimeMins']) ? intval($body['prepTimeMins']) : 15;
        $isCooked = isset($body['isCooked']) ? boolval($body['isCooked']) : true;
        $stock = isset($body['stock']) && $body['stock'] !== null ? intval($body['stock']) : null;
        $isVegetarian = isset($body['isVegetarian']) ? boolval($body['isVegetarian']) : true;
        $discountPercent = isset($body['discountPercent']) && $body['discountPercent'] !== null ? floatval($body['discountPercent']) : null;
        $discountStart = $body['discountStart'] ?? null;
        $discountEnd = $body['discountEnd'] ?? null;
        $categoryId = $body['categoryId'] ?? null;

        if (!$name || $price === null || !$categoryId) {
            Response::error("name, price, and categoryId are required", 400);
        }

        // Ownership check
        $catStmt = $this->db->prepare("SELECT vendorId FROM Category WHERE id = ?");
        $catStmt->execute([$categoryId]);
        $category = $catStmt->fetch();

        if (!$category) {
            Response::error("Category not found", 404);
        }
        if ($category['vendorId'] !== $vendorId) {
            Response::error("You do not own this category", 403);
        }

        $id = $this->generateUuid();
        $insert = $this->db->prepare("
            INSERT INTO FoodItem (
                id, name, description, price, imageUrl, prepTimeMins, 
                isCooked, stock, isVegetarian, discountPercent, discountStart, discountEnd, categoryId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $insert->execute([
            $id, $name, $description, $price, $imageUrl, $prepTimeMins,
            $isCooked ? 1 : 0, $stock, $isVegetarian ? 1 : 0, $discountPercent, $discountStart, $discountEnd, $categoryId
        ]);

        Response::json([
            "item" => [
                "id" => $id,
                "name" => $name,
                "description" => $description,
                "price" => $price,
                "imageUrl" => $imageUrl,
                "prepTimeMins" => $prepTimeMins,
                "isCooked" => $isCooked,
                "stock" => $stock,
                "isVegetarian" => $isVegetarian,
                "discountPercent" => $discountPercent,
                "discountStart" => $discountStart,
                "discountEnd" => $discountEnd,
                "categoryId" => $categoryId
            ]
        ], 201);
    }

    public function updateFoodItem(array $user, string $id, array $body): void {
        $vendorId = $user['sub'];

        // Ownership check
        $stmt = $this->db->prepare("
            SELECT f.*, c.vendorId 
            FROM FoodItem f 
            JOIN Category c ON f.categoryId = c.id 
            WHERE f.id = ?
        ");
        $stmt->execute([$id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::error("Food item not found", 404);
        }
        if ($existing['vendorId'] !== $vendorId) {
            Response::error("You do not own this food item", 403);
        }

        $categoryId = $body['categoryId'] ?? $existing['categoryId'];
        if ($categoryId !== $existing['categoryId']) {
            $catStmt = $this->db->prepare("SELECT vendorId FROM Category WHERE id = ?");
            $catStmt->execute([$categoryId]);
            $newCat = $catStmt->fetch();

            if (!$newCat || $newCat['vendorId'] !== $vendorId) {
                Response::error("Target category is invalid or not owned by you", 403);
            }
        }

        $name = array_key_exists('name', $body) ? $body['name'] : $existing['name'];
        $description = array_key_exists('description', $body) ? $body['description'] : $existing['description'];
        $price = array_key_exists('price', $body) ? floatval($body['price']) : floatval($existing['price']);
        $imageUrl = array_key_exists('imageUrl', $body) ? $body['imageUrl'] : $existing['imageUrl'];
        $prepTimeMins = array_key_exists('prepTimeMins', $body) ? intval($body['prepTimeMins']) : intval($existing['prepTimeMins']);
        $isCooked = array_key_exists('isCooked', $body) ? boolval($body['isCooked']) : boolval($existing['isCooked']);
        $stock = array_key_exists('stock', $body) ? ($body['stock'] !== null ? intval($body['stock']) : null) : ($existing['stock'] !== null ? intval($existing['stock']) : null);
        $isVegetarian = array_key_exists('isVegetarian', $body) ? boolval($body['isVegetarian']) : boolval($existing['isVegetarian']);
        $discountPercent = array_key_exists('discountPercent', $body) ? ($body['discountPercent'] !== null ? floatval($body['discountPercent']) : null) : ($existing['discountPercent'] !== null ? floatval($existing['discountPercent']) : null);
        $discountStart = array_key_exists('discountStart', $body) ? $body['discountStart'] : $existing['discountStart'];
        $discountEnd = array_key_exists('discountEnd', $body) ? $body['discountEnd'] : $existing['discountEnd'];

        $update = $this->db->prepare("
            UPDATE FoodItem SET 
                name = ?, description = ?, price = ?, imageUrl = ?, prepTimeMins = ?, 
                isCooked = ?, stock = ?, isVegetarian = ?, discountPercent = ?, discountStart = ?, discountEnd = ?, categoryId = ?
            WHERE id = ?
        ");
        $update->execute([
            $name, $description, $price, $imageUrl, $prepTimeMins,
            $isCooked ? 1 : 0, $stock, $isVegetarian ? 1 : 0, $discountPercent, $discountStart, $discountEnd, $categoryId,
            $id
        ]);

        Response::json([
            "item" => [
                "id" => $id,
                "name" => $name,
                "description" => $description,
                "price" => $price,
                "imageUrl" => $imageUrl,
                "prepTimeMins" => $prepTimeMins,
                "isCooked" => $isCooked,
                "stock" => $stock,
                "isVegetarian" => $isVegetarian,
                "discountPercent" => $discountPercent,
                "discountStart" => $discountStart,
                "discountEnd" => $discountEnd,
                "categoryId" => $categoryId
            ]
        ]);
    }

    public function deleteFoodItem(array $user, string $id): void {
        $vendorId = $user['sub'];

        $stmt = $this->db->prepare("
            SELECT f.*, c.vendorId 
            FROM FoodItem f 
            JOIN Category c ON f.categoryId = c.id 
            WHERE f.id = ?
        ");
        $stmt->execute([$id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::error("Food item not found", 404);
        }
        if ($existing['vendorId'] !== $vendorId) {
            Response::error("You do not own this food item", 403);
        }

        $del = $this->db->prepare("DELETE FROM FoodItem WHERE id = ?");
        $del->execute([$id]);

        Response::json(["message" => "Food item deleted successfully"]);
    }
}
