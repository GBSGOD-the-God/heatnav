<?php
require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['error' => 'method']);
}

$in = body();
$email = strtolower(trim($in['email'] ?? ''));
$password = (string)($in['password'] ?? '');

$st = db()->prepare('SELECT * FROM users WHERE email = ?');
$st->execute([$email]);
$user = $st->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['password_hash'] === '' || !password_verify($password, $user['password_hash'])) {
    respond(401, ['error' => 'bad-credentials', 'message' => 'Wrong email or password.']);
}
if ((int)$user['verified'] !== 1) {
    respond(403, ['error' => 'unverified', 'message' => 'Please verify your email first — check your inbox for the link.']);
}

respond(200, [
    'ok' => true,
    'token' => issueToken((int)$user['id']),
    'name' => $user['name'],
    'email' => $user['email'],
]);
