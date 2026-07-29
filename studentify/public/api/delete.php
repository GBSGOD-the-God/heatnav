<?php
require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['error' => 'method']);
}

$user = requireUser();
$pdo = db();
$pdo->prepare('DELETE FROM user_data WHERE user_id = ?')->execute([$user['id']]);
$pdo->prepare('DELETE FROM tokens WHERE user_id = ?')->execute([$user['id']]);
$pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$user['id']]);
respond(200, ['ok' => true]);
