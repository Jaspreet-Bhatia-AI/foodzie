<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;

class CategoryController {
    private \PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    private function generateUuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[3]) & 0x3f | 0x80); // Slight variation
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    public function getCategories(array $user): void {
        $vendorId = $user['sub'];

        $stmt = $this->db->prepare("SELECT * FROM Category WHERE vendorId = ? ORDER BY name ASC");
        $stmt->execute([$vendorId]);
        $categories = $stmt->fetchAll();

        // Fetch items for each category
        foreach ($categories as &$cat) {
            $itemStmt = $this->db->prepare("SELECT * FROM FoodItem WHERE categoryId = ? ORDER BY name ASC");
            $itemStmt->execute([$cat['id']]);
            $cat['items'] = $itemStmt->fetchAll();
            
            // Map types from MySQL integers/strings to PHP equivalents
            foreach ($cat['items'] as &$item) {
                $item['price'] = floatval($item['price']);
                $item['prepTimeMins'] = intval($item['prepTimeMins']);
                $item['isCooked'] = boolval($item['isCooked']);
                $item['stock'] = $item['stock'] !== null ? intval($item['stock']) : null;
                $item['isVegetarian'] = boolval($item['isVegetarian']);
                $item['discountPercent'] = $item['discountPercent'] !== null ? floatval($item['discountPercent']) : null;
            }
        }

        Response::json(["categories" => $categories]);
    }

    public function createCategory(array $user, array $body): void {
        $vendorId = $user['sub'];
        $name = $body['name'] ?? null;

        if (!$name) {
            Response::error("name is required", 400);
        }

        $id = $this->generateUuid();
        $stmt = $this->db->prepare("INSERT INTO Category (id, name, vendorId) VALUES (?, ?, ?)");
        $stmt->execute([$id, $name, $vendorId]);

        Response::json([
            "category" => [
                "id" => $id,
                "name" => $name,
                "vendorId" => $vendorId
            ]
        ], 201);
    }

    public function updateCategory(array $user, string $id, array $body): void {
        $vendorId = $user['sub'];
        $name = $body['name'] ?? null;

        if (!$name) {
            Response::error("name is required", 400);
        }

        // Ownership check
        $stmt = $this->db->prepare("SELECT * FROM Category WHERE id = ?");
        $stmt->execute([$id]);
        $category = $stmt->fetch();

        if (!$category) {
            Response::error("Category not found", 404);
        }
        if ($category['vendorId'] !== $vendorId) {
            Response::error("You do not own this category", 403);
        }

        $update = $this->db->prepare("UPDATE Category SET name = ? WHERE id = ?");
        $update->execute([$name, $id]);

        Response::json([
            "category" => [
                "id" => $id,
                "name" => $name,
                "vendorId" => $vendorId
            ]
        ]);
    }

    public function deleteCategory(array $user, string $id): void {
        $vendorId = $user['sub'];

        // Ownership check
        $stmt = $this->db->prepare("SELECT * FROM Category WHERE id = ?");
        $stmt->execute([$id]);
        $category = $stmt->fetch();

        if (!$category) {
            Response::error("Category not found", 404);
        }
        if ($category['vendorId'] !== $vendorId) {
            Response::error("You do not own this category", 403);
        }

        // Cascade delete (remove food items under category first)
        $delItems = $this->db->prepare("DELETE FROM FoodItem WHERE categoryId = ?");
        $delItems->execute([$id]);

        $delCat = $this->db->prepare("DELETE FROM Category WHERE id = ?");
        $delCat->execute([$id]);

        Response::json(["message" => "Category and its food items deleted successfully"]);
    }
}
