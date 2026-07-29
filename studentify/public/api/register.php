<?php
require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['error' => 'method']);
}

$in = body();
$email = strtolower(trim($in['email'] ?? ''));
$name = trim($in['name'] ?? '');
$password = (string)($in['password'] ?? '');

if ($name === '' || mb_strlen($name) > 100) {
    respond(400, ['error' => 'bad-name', 'message' => 'Please enter your name.']);
}
if (strlen($password) < 8) {
    respond(400, ['error' => 'bad-password', 'message' => 'Password must be at least 8 characters.']);
}
if (($err = validateEmail($email)) !== null) {
    respond(400, ['error' => 'bad-email', 'message' => $err]);
}

$pdo = db();
$st = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$st->execute([$email]);
$existing = $st->fetch(PDO::FETCH_ASSOC);

if ($existing && (int)$existing['verified'] === 1) {
    respond(409, ['error' => 'email-taken', 'message' => 'An account with this email already exists — try logging in.']);
}

$hash = password_hash($password, PASSWORD_DEFAULT);

// Verification disabled (no working mail on this host yet):
// activate instantly and log the user straight in.
if (!$REQUIRE_EMAIL_VERIFICATION) {
    if ($existing) {
        $pdo->prepare('UPDATE users SET name = ?, password_hash = ?, verified = 1, verify_token = NULL WHERE id = ?')
            ->execute([$name, $hash, $existing['id']]);
        $userId = (int)$existing['id'];
    } else {
        $pdo->prepare('INSERT INTO users (email, name, password_hash, verified) VALUES (?, ?, ?, 1)')
            ->execute([$email, $name, $hash]);
        $userId = (int)$pdo->lastInsertId();
    }
    respond(200, [
        'ok' => true,
        'token' => issueToken($userId),
        'name' => $name,
        'email' => $email,
    ]);
}

$verifyToken = bin2hex(random_bytes(32));

if ($existing) {
    // Unverified account signing up again: refresh details and resend the link.
    $pdo->prepare('UPDATE users SET name = ?, password_hash = ?, verify_token = ? WHERE id = ?')
        ->execute([$name, $hash, $verifyToken, $existing['id']]);
} else {
    $pdo->prepare('INSERT INTO users (email, name, password_hash, verify_token) VALUES (?, ?, ?, ?)')
        ->execute([$email, $name, $hash, $verifyToken]);
}

$mailSent = sendVerificationMail($email, $verifyToken);

$out = ['ok' => true, 'mailSent' => $mailSent];
if (!$mailSent) {
    // Mail delivery unavailable on this server — surface the link so signup isn't a dead end.
    $out['verifyLink'] = siteBase() . '/api/verify.php?token=' . urlencode($verifyToken);
    $out['message'] = 'We could not send the verification email from this server, so here is your verification link directly.';
}
respond(200, $out);
