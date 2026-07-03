<?php

namespace App\Helpers;

class Response {
    public static function json($data, int $status = 200): void {
        header("Content-Type: application/json; charset=UTF-8");
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    public static function error(string $message, int $status = 500): void {
        self::json(["error" => $message], $status);
    }
}
