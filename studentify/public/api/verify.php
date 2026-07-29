<?php
require __DIR__ . '/config.php';

$token = $_GET['token'] ?? '';
if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
    header('Content-Type: text/html; charset=utf-8');
    http_response_code(400);
    echo '<p style="font-family:sans-serif">Invalid verification link.</p>';
    exit;
}

$pdo = db();
$st = $pdo->prepare('SELECT id FROM users WHERE verify_token = ?');
$st->execute([$token]);
$user = $st->fetch(PDO::FETCH_ASSOC);

if ($user) {
    $pdo->prepare('UPDATE users SET verified = 1, verify_token = NULL WHERE id = ?')
        ->execute([$user['id']]);
    header('Location: ' . siteBase() . '/login/?verified=1');
} else {
    // Token already used or unknown — send them to login either way.
    header('Location: ' . siteBase() . '/login/?verified=0');
}
exit;
