<?php
require __DIR__ . '/config.php';

// GET: tell the frontend whether Google sign-in is configured (and with which client ID).
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    respond(200, ['clientId' => $GOOGLE_CLIENT_ID !== '' ? $GOOGLE_CLIENT_ID : null]);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['error' => 'method']);
}
if ($GOOGLE_CLIENT_ID === '') {
    respond(503, ['error' => 'google-not-configured', 'message' => 'Google sign-in is not set up on this server.']);
}

$in = body();
$credential = (string)($in['credential'] ?? '');
if ($credential === '') {
    respond(400, ['error' => 'bad-request']);
}

// Verify the ID token with Google.
$url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential);
$raw = @file_get_contents($url);
if ($raw === false && function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
    $raw = curl_exec($ch);
    curl_close($ch);
}
$info = json_decode((string)$raw, true);

if (
    !is_array($info) ||
    ($info['aud'] ?? '') !== $GOOGLE_CLIENT_ID ||
    empty($info['email']) ||
    ($info['email_verified'] ?? 'false') !== 'true' ||
    (int)($info['exp'] ?? 0) < time()
) {
    respond(401, ['error' => 'bad-google-token', 'message' => 'Google sign-in could not be verified.']);
}

$email = strtolower($info['email']);
$sub = (string)($info['sub'] ?? '');
$name = trim((string)($info['given_name'] ?? $info['name'] ?? 'Student'));

$pdo = db();
$st = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$st->execute([$email]);
$user = $st->fetch(PDO::FETCH_ASSOC);

if ($user) {
    $pdo->prepare('UPDATE users SET verified = 1, google_sub = ? WHERE id = ?')
        ->execute([$sub, $user['id']]);
    $userId = (int)$user['id'];
    $name = $user['name'] !== '' ? $user['name'] : $name;
} else {
    $pdo->prepare('INSERT INTO users (email, name, verified, google_sub) VALUES (?, ?, 1, ?)')
        ->execute([$email, $name, $sub]);
    $userId = (int)$pdo->lastInsertId();
}

respond(200, [
    'ok' => true,
    'token' => issueToken($userId),
    'name' => $name,
    'email' => $email,
]);
