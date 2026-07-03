<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;

class MenuController {
    private \PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    private function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float {
        $R = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        return $R * $c;
    }

    public function getUniversities(array $queryParams): void {
        $lat = $queryParams['lat'] ?? null;
        $lng = $queryParams['lng'] ?? null;

        $stmt = $this->db->query("SELECT * FROM University ORDER BY name ASC");
        $universities = $stmt->fetchAll();

        foreach ($universities as &$uni) {
            $uni['lat'] = $uni['lat'] !== null ? floatval($uni['lat']) : null;
            $uni['lng'] = $uni['lng'] !== null ? floatval($uni['lng']) : null;
        }

        if ($lat !== null && $lng !== null) {
            $userLat = floatval($lat);
            $userLng = floatval($lng);

            foreach ($universities as &$uni) {
                $uni['distance'] = ($uni['lat'] !== null && $uni['lng'] !== null) 
                    ? $this->calculateDistance($userLat, $userLng, $uni['lat'], $uni['lng']) 
                    : INF;
            }

            usort($universities, function($a, $b) {
                return $a['distance'] <=> $b['distance'];
            });

            // Strip temporary distance fields
            foreach ($universities as &$uni) {
                unset($uni['distance']);
            }
        }

        Response::json(["universities" => $universities]);
    }

    private function formatDiscount(?float $percent, ?string $start, ?string $end, float $price): ?array {
        if ($percent === null || $percent <= 0) {
            return null;
        }
        return [
            "percent" => $percent,
            "validFrom" => $start,
            "validTo" => $end,
            "effectivePrice" => floatval(number_format($price * (1 - $percent / 100), 2, '.', ''))
        ];
    }

    public function getUniversityMenu(string $universityId): void {
        $uniStmt = $this->db->prepare("SELECT * FROM University WHERE id = ?");
        $uniStmt->execute([$universityId]);
        $university = $uniStmt->fetch();

        if (!$university) {
            Response::error("University not found", 404);
        }

        // Fetch vendors for university
        $vendorStmt = $this->db->prepare("SELECT id, name, profilePicUrl FROM User WHERE role = 'Vendor' AND universityId = ? ORDER BY name ASC");
        $vendorStmt->execute([$universityId]);
        $vendorsRaw = $vendorStmt->fetchAll();

        $vendors = [];
        foreach ($vendorsRaw as $vendor) {
            $catStmt = $this->db->prepare("SELECT id, name FROM Category WHERE vendorId = ? ORDER BY name ASC");
            $catStmt->execute([$vendor['id']]);
            $categoriesRaw = $catStmt->fetchAll();

            $categories = [];
            foreach ($categoriesRaw as $cat) {
                $itemStmt = $this->db->prepare("SELECT * FROM FoodItem WHERE categoryId = ? ORDER BY name ASC");
                $itemStmt->execute([$cat['id']]);
                $itemsRaw = $itemStmt->fetchAll();

                $items = [];
                foreach ($itemsRaw as $item) {
                    $items[] = [
                        "id" => $item['id'],
                        "name" => $item['name'],
                        "description" => $item['description'],
                        "price" => floatval($item['price']),
                        "imageUrl" => $item['imageUrl'],
                        "prepTimeMins" => intval($item['prepTimeMins']),
                        "isCooked" => boolval($item['isCooked']),
                        "stock" => $item['stock'] !== null ? intval($item['stock']) : null,
                        "isVegetarian" => boolval($item['isVegetarian']),
                        "discount" => $this->formatDiscount(
                            $item['discountPercent'] !== null ? floatval($item['discountPercent']) : null,
                            $item['discountStart'],
                            $item['discountEnd'],
                            floatval($item['price'])
                        )
                    ];
                }

                $categories[] = [
                    "categoryId" => $cat['id'],
                    "categoryName" => $cat['name'],
                    "items" => $items
                ];
            }

            $vendors[] = [
                "vendorId" => $vendor['id'],
                "vendorName" => $vendor['name'],
                "vendorLogoUrl" => $vendor['profilePicUrl'],
                "categories" => $categories
            ];
        }

        Response::json([
            "universityId" => $university['id'],
            "universityName" => $university['name'],
            "universityAddress" => $university['address'],
            "city" => $university['city'],
            "country" => $university['country'],
            "vendors" => $vendors
        ]);
    }

    public function getVendorMenu(string $vendorId): void {
        $vendorStmt = $this->db->prepare("SELECT id, name, profilePicUrl, universityId FROM User WHERE id = ? AND role = 'Vendor'");
        $vendorStmt->execute([$vendorId]);
        $vendor = $vendorStmt->fetch();

        if (!$vendor) {
            Response::error("Vendor not found", 404);
        }

        // Fetch categories for vendor
        $catStmt = $this->db->prepare("SELECT id, name FROM Category WHERE vendorId = ? ORDER BY name ASC");
        $catStmt->execute([$vendorId]);
        $categoriesRaw = $catStmt->fetchAll();

        $categories = [];
        foreach ($categoriesRaw as $cat) {
            $itemStmt = $this->db->prepare("SELECT * FROM FoodItem WHERE categoryId = ? ORDER BY name ASC");
            $itemStmt->execute([$cat['id']]);
            $itemsRaw = $itemStmt->fetchAll();

            $items = [];
            foreach ($itemsRaw as $item) {
                $items[] = [
                    "id" => $item['id'],
                    "name" => $item['name'],
                    "description" => $item['description'],
                    "price" => floatval($item['price']),
                    "imageUrl" => $item['imageUrl'],
                    "prepTimeMins" => intval($item['prepTimeMins']),
                    "isCooked" => boolval($item['isCooked']),
                    "stock" => $item['stock'] !== null ? intval($item['stock']) : null,
                    "isVegetarian" => boolval($item['isVegetarian']),
                    "discount" => $this->formatDiscount(
                        $item['discountPercent'] !== null ? floatval($item['discountPercent']) : null,
                        $item['discountStart'],
                        $item['discountEnd'],
                        floatval($item['price'])
                    )
                ];
            }

            $categories[] = [
                "categoryId" => $cat['id'],
                "categoryName" => $cat['name'],
                "items" => $items
            ];
        }

        Response::json([
            "vendorId" => $vendor['id'],
            "vendorName" => $vendor['name'],
            "vendorLogoUrl" => $vendor['profilePicUrl'],
            "universityId" => $vendor['universityId'],
            "categories" => $categories
        ]);
    }
}
