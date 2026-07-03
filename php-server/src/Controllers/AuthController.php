<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use Firebase\JWT\JWT;
use Exception;

class AuthController {
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

    private function signToken(string $userId, string $role, ?string $universityName): string {
        $secret = $_ENV['JWT_SECRET'] ?? '';
        $expiresIn = intval($_ENV['JWT_EXPIRES_IN'] ?? 604800); // Default to 7 days
        
        $payload = [
            "sub" => $userId,
            "role" => $role,
            "universityName" => $universityName,
            "exp" => time() + $expiresIn
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }

    public function register(array $body): void {
        $name = $body['name'] ?? null;
        $email = $body['email'] ?? null;
        $password = $body['password'] ?? null;
        $phone = $body['phone'] ?? null;
        $role = $body['role'] ?? 'Student';
        $universityName = $body['universityName'] ?? null;
        $lat = isset($body['lat']) ? floatval($body['lat']) : null;
        $lng = isset($body['lng']) ? floatval($body['lng']) : null;

        if (!$name || !$email || !$password) {
            Response::error("name, email, and password are required", 400);
        }

        $validRoles = ["Student", "Vendor", "Delivery"];
        if (!in_array($role, $validRoles)) {
            Response::error("role must be one of: " . implode(", ", $validRoles), 400);
        }

        // Check duplicates
        $stmt = $this->db->prepare("SELECT id FROM User WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            Response::error("A user with this email already exists", 409);
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        $universityId = null;
        $finalUniName = null;

        if ($universityName) {
            $universityName = trim($universityName);
            $uniStmt = $this->db->prepare("SELECT id, name FROM University WHERE name = ?");
            $uniStmt->execute([$universityName]);
            $uni = $uniStmt->fetch();

            if ($uni) {
                $universityId = $uni['id'];
                $finalUniName = $uni['name'];
            } else {
                $universityId = $this->generateUuid();
                $finalUniName = $universityName;
                $insertUni = $this->db->prepare("INSERT INTO University (id, name, lat, lng) VALUES (?, ?, ?, ?)");
                $insertUni->execute([$universityId, $universityName, $lat, $lng]);
            }
        }

        $userId = $this->generateUuid();
        $insertUser = $this->db->prepare("INSERT INTO User (id, name, email, password, phone, role, universityId) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $insertUser->execute([$userId, $name, $email, $hashedPassword, $phone, $role, $universityId]);

        $token = $this->signToken($userId, $role, $finalUniName);

        Response::json([
            "user" => [
                "id" => $userId,
                "name" => $name,
                "email" => $email,
                "role" => $role,
                "universityId" => $universityId,
                "universityName" => $finalUniName,
                "createdAt" => date('Y-m-d H:i:s')
            ],
            "token" => $token
        ], 201);
    }

    public function login(array $body): void {
        $email = $body['email'] ?? null;
        $password = $body['password'] ?? null;

        if (!$email || !$password) {
            Response::error("email and password are required", 400);
        }

        $stmt = $this->db->prepare("SELECT u.*, uni.name as universityName FROM User u LEFT JOIN University uni ON u.universityId = uni.id WHERE u.email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            Response::error("Invalid credentials", 401);
        }

        $token = $this->signToken($user['id'], $user['role'], $user['universityName']);

        Response::json([
            "user" => [
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "role" => $user['role'],
                "universityId" => $user['universityId'],
                "universityName" => $user['universityName']
            ],
            "token" => $token
        ]);
    }

    public function getMe(array $user): void {
        $stmt = $this->db->prepare("SELECT u.*, uni.name as universityName FROM User u LEFT JOIN University uni ON u.universityId = uni.id WHERE u.id = ?");
        $stmt->execute([$user['sub']]);
        $profile = $stmt->fetch();

        if (!$profile) {
            Response::error("User not found", 404);
        }

        Response::json([
            "id" => $profile['id'],
            "name" => $profile['name'],
            "email" => $profile['email'],
            "phone" => $profile['phone'],
            "role" => $profile['role'],
            "universityId" => $profile['universityId'],
            "universityName" => $profile['universityName'],
            "vendorDescription" => $profile['vendorDescription']
        ]);
    }

    public function updateMe(array $user, array $body): void {
        $userId = $user['sub'];
        $name = $body['name'] ?? null;
        $phone = $body['phone'] ?? null;
        $universityName = $body['universityName'] ?? null;
        $vendorDescription = $body['vendorDescription'] ?? null;

        $universityId = null;
        if ($universityName) {
            $universityName = trim($universityName);
            $uniStmt = $this->db->prepare("SELECT id FROM University WHERE name = ?");
            $uniStmt->execute([$universityName]);
            $uni = $uniStmt->fetch();

            if ($uni) {
                $universityId = $uni['id'];
            } else {
                $universityId = $this->generateUuid();
                $insertUni = $this->db->prepare("INSERT INTO University (id, name) VALUES (?, ?)");
                $insertUni->execute([$universityId, $universityName]);
            }
        }

        // Fetch current user
        $currStmt = $this->db->prepare("SELECT * FROM User WHERE id = ?");
        $currStmt->execute([$userId]);
        $current = $currStmt->fetch();

        if (!$current) {
            Response::error("User not found", 404);
        }

        $finalName = $name !== null ? $name : $current['name'];
        $finalPhone = $phone !== null ? $phone : $current['phone'];
        $finalUniId = $universityName !== null ? $universityId : $current['universityId'];
        $finalDesc = $vendorDescription !== null ? $vendorDescription : $current['vendorDescription'];

        $update = $this->db->prepare("UPDATE User SET name = ?, phone = ?, universityId = ?, vendorDescription = ? WHERE id = ?");
        $update->execute([$finalName, $finalPhone, $finalUniId, $finalDesc, $userId]);

        // Get updated details
        $stmt = $this->db->prepare("SELECT u.*, uni.name as universityName FROM User u LEFT JOIN University uni ON u.universityId = uni.id WHERE u.id = ?");
        $stmt->execute([$userId]);
        $updated = $stmt->fetch();

        Response::json([
            "id" => $updated['id'],
            "name" => $updated['name'],
            "email" => $updated['email'],
            "phone" => $updated['phone'],
            "role" => $updated['role'],
            "universityId" => $updated['universityId'],
            "universityName" => $updated['universityName'],
            "vendorDescription" => $updated['vendorDescription']
        ]);
    }
}
