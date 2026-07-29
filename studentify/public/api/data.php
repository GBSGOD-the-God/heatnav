<?php
require __DIR__ . '/config.php';

$user = requireUser();
$method = $_SERVER['REQUEST_METHOD'] ?? '';

if ($method === 'GET') {
    $st = db()->prepare('SELECT state, updated_at FROM user_data WHERE user_id = ?');
    $st->execute([$user['id']]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    respond(200, [
        'state' => $row ? json_decode($row['state'], true) : null,
        'updatedAt' => $row['updated_at'] ?? null,
    ]);
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    if (strlen($raw) > 4 * 1024 * 1024) {
        respond(413, ['error' => 'too-large']);
    }
    $state = json_decode($raw, true);
    if (!is_array($state)) {
        respond(400, ['error' => 'bad-json']);
    }
    // Never persist the user's Mistral key server-side — it belongs to their device.
    if (isset($state['settings']) && is_array($state['settings'])) {
        $state['settings']['mistralKey'] = '';
    }
    db()->prepare(
        'INSERT INTO user_data (user_id, state) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE state = VALUES(state)'
    )->execute([$user['id'], json_encode($state)]);
    respond(200, ['ok' => true]);
}

respond(405, ['error' => 'method']);
