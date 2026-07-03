<?php

namespace App\Helpers;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class Auth {
    public static function authenticate(): array {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!$authHeader || !preg_match('/Bearer\s(\S+)/i', $authHeader, $matches)) {
            Response::error("Authorization token required", 401);
        }

        $token = $matches[1];
        $secret = $_ENV['JWT_SECRET'] ?? '';

        try {
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            return (array) $decoded;
        } catch (Exception $e) {
            Response::error("Invalid or expired token", 401);
        }
        return [];
    }

    public static function requireRole(array $user, string ...$roles): void {
        if (!isset($user['role']) || !in_array($user['role'], $roles)) {
            Response::error("Forbidden", 403);
        }
    }
}
